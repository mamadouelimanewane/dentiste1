import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Callback de statut Twilio (SMS et WhatsApp).
//
// Sans ce point d'entrée, un message refusé par Twilio après acceptation de
// la requête (numéro invalide, Sandbox WhatsApp non rejoint, opérateur qui
// bloque...) restait affiché comme "envoyé" au personnel : le cabinet
// croyait le patient prévenu alors que rien n'était parti. Twilio notifie
// ici chaque changement d'état et la ligne patient_messages est corrigée.
//
// Twilio signe chaque requête (X-Twilio-Signature) : HMAC-SHA1 de l'URL
// suivie des paramètres POST triés par clé, encodé en base64.
function isValidTwilioSignature(url: string, params: Record<string, string>, signature: string, authToken: string) {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const expected = crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// Correspondance des statuts Twilio vers l'enum message_status de la base.
const STATUS_MAP: Record<string, string> = {
  queued: 'sent',
  sending: 'sent',
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  undelivered: 'failed',
  failed: 'failed',
  canceled: 'failed',
};

export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    return new NextResponse('Not configured', { status: 404 });
  }

  const raw = await request.formData();
  const params: Record<string, string> = {};
  raw.forEach((value, key) => {
    params[key] = String(value);
  });

  const signature = request.headers.get('x-twilio-signature');
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/api/twilio/status`;

  if (!signature || !isValidTwilioSignature(callbackUrl, params, signature, authToken)) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  const sid = params.MessageSid || params.SmsSid;
  const twilioStatus = params.MessageStatus || params.SmsStatus;
  if (!sid || !twilioStatus) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  const mapped = STATUS_MAP[twilioStatus];
  if (!mapped) {
    // Statut intermédiaire non pertinent : accusé de réception sans écriture.
    return new NextResponse('OK', { status: 200 });
  }

  // Motif de l'échec. Twilio le transmet dans ErrorCode/ErrorMessage, mais il
  // n'était pas conservé : un SMS échouait sans que le cabinet puisse savoir
  // si le numéro était invalide, le crédit épuisé ou le pays non autorisé —
  // trois situations qui appellent des réponses différentes.
  const codeErreur = params.ErrorCode;
  const messageErreur = params.ErrorMessage;
  const detail =
    codeErreur || messageErreur
      ? `${codeErreur || ''} ${messageErreur || ''}`.trim().slice(0, 300)
      : null;

  await sql`
    update patient_messages
    set status = ${mapped}::message_status,
        error_detail = coalesce(${detail}, error_detail)
    where provider_message_id = ${sid}
  `;

  return new NextResponse('OK', { status: 200 });
}
