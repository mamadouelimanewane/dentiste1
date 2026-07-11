import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { sendWhatsAppMessage } from '@/lib/integrations/whatsapp';
import { sendSms } from '@/lib/integrations/sms';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h pour cliquer le lien

function getBaseUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

// Génère un lien magique à usage unique pour qu'un patient accède au
// portail (aucun mot de passe). Envoyé par WhatsApp ou SMS ; en mode démo
// (clés non configurées) le lien est retourné directement dans la réponse
// pour affichage à l'écran côté staff.
export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(18, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId, channel } = body as { patientId?: string; channel?: 'whatsapp' | 'sms' };

  if (!patientId) {
    return NextResponse.json({ error: 'patientId est requis.' }, { status: 400 });
  }

  const patients = await sql`select id, full_name, phone from patients where id = ${patientId} limit 1`;
  const patient = patients[0];

  if (!patient) {
    return NextResponse.json({ error: 'Patient introuvable.' }, { status: 404 });
  }
  if (!patient.phone) {
    return NextResponse.json({ error: "Ce patient n'a pas de numéro de téléphone enregistré." }, { status: 400 });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  await sql`
    insert into patient_portal_tokens (patient_id, token, expires_at, created_by)
    values (${patientId}, ${token}, ${expiresAt}, ${session!.userId})
  `;

  const link = `${getBaseUrl(request)}/portal/auth?token=${token}`;
  const messageBody = `Bonjour ${patient.full_name}, voici votre lien sécurisé vers l'espace patient du Cabinet Dentaire du Cap Vert (valable 24h) : ${link}`;

  const result =
    channel === 'sms'
      ? await sendSms({ patientId, phone: patient.phone, body: messageBody, sentBy: session!.userId })
      : await sendWhatsAppMessage({ patientId, phone: patient.phone, body: messageBody, sentBy: session!.userId });

  return NextResponse.json({
    link,
    simulated: result.simulated,
    error: result.error,
  });
}
