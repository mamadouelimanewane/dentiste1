import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// Statuts renvoyés par Meta sur l'événement "statuses" du webhook.
const STATUS_MAP: Record<string, string> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
};

// Vérification du webhook exigée par Meta lors de sa configuration.
export async function GET(request: Request) {
  if (!VERIFY_TOKEN) {
    // Webhook non configuré : on ne répond jamais au challenge tant que
    // le cabinet n'a pas créé de compte WhatsApp Business.
    return new NextResponse('Not configured', { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

function isValidSignature(rawBody: string, signatureHeader: string | null) {
  if (!APP_SECRET || !signatureHeader) return false;
  const expected =
    'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!VERIFY_TOKEN) {
    return new NextResponse('Not configured', { status: 404 });
  }

  const rawBody = await request.text();

  if (!APP_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      // Un webhook configuré (VERIFY_TOKEN présent) sans secret d'app ne doit
      // jamais accepter de payload non authentifié en production.
      return new NextResponse('App secret not configured', { status: 401 });
    }
  } else {
    const signature = request.headers.get('x-hub-signature-256');
    if (!isValidSignature(rawBody, signature)) {
      return new NextResponse('Invalid signature', { status: 401 });
    }
  }

  const payload = JSON.parse(rawBody);

  // Accusés de livraison Meta. Sans ce traitement, l'application marquait
  // "sent" dès que Meta acceptait la requête : or Meta accepte puis rejette
  // de façon asynchrone (typiquement 131047, hors fenêtre de 24h sans
  // modèle approuvé). Le cabinet croyait donc ses rappels distribués.
  const statuses =
    payload?.entry?.flatMap((entry: any) =>
      entry?.changes?.flatMap((change: any) => change?.value?.statuses || [])
    ) || [];

  for (const st of statuses) {
    const mapped = STATUS_MAP[st.status] || null;
    if (!mapped || !st.id) continue;
    const detail = st.errors?.[0]
      ? `${st.errors[0].code} ${st.errors[0].title || st.errors[0].message || ''}`.trim()
      : null;
    await sql`
      update patient_messages
      set status = ${mapped},
          error_detail = coalesce(${detail}, error_detail)
      where provider_message_id = ${st.id}
    `;
  }

  const messages =
    payload?.entry?.flatMap((entry: any) =>
      entry?.changes?.flatMap((change: any) => change?.value?.messages || [])
    ) || [];

  for (const msg of messages) {
    const phone = msg.from;
    const body = msg.text?.body || `[${msg.type}]`;

    const patientRows = await sql`select id from patients where phone = ${phone} limit 1`;
    const patientId = patientRows[0]?.id ?? null;

    await sql`
      insert into patient_messages (patient_id, phone, channel, direction, body, status, provider_message_id)
      values (${patientId}, ${phone}, 'whatsapp', 'inbound', ${body}, 'received', ${msg.id})
    `;
  }

  return NextResponse.json({ received: true });
}
