import 'server-only';
import { sql } from '@/lib/db';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

export function isSmsConfigured() {
  return !!ACCOUNT_SID && !!AUTH_TOKEN && !!FROM_NUMBER;
}

interface SendResult {
  simulated: boolean;
  providerMessageId?: string;
  error?: string;
}

async function logMessage(params: {
  patientId?: string | null;
  phone: string;
  body: string;
  status: string;
  providerMessageId?: string | null;
  sentBy?: string | null;
}) {
  await sql`
    insert into patient_messages (patient_id, phone, channel, direction, body, status, provider_message_id, sent_by)
    values (${params.patientId ?? null}, ${params.phone}, 'sms', 'outbound', ${params.body}, ${params.status}, ${params.providerMessageId ?? null}, ${params.sentBy ?? null})
  `;
}

// Envoie un SMS via l'API Twilio. Sans clés configurées, journalise
// directement le message en base avec le statut "simulated" au lieu
// d'appeler le réseau — l'UI affiche alors un badge "Mode démo".
export async function sendSms(params: {
  patientId?: string | null;
  phone: string;
  body: string;
  sentBy?: string | null;
}): Promise<SendResult> {
  const { patientId, phone, body, sentBy } = params;

  if (!isSmsConfigured()) {
    await logMessage({ patientId, phone, body, status: 'simulated', sentBy });
    return { simulated: true };
  }

  try {
    // Twilio exige le format E.164 (préfixe "+") pour le SMS — contrairement
    // à l'API WhatsApp qui accepte le numéro tel quel après le préfixe
    // "whatsapp:". Les numéros patients sont souvent saisis sans le "+".
    const to = phone.startsWith('+') ? phone : `+${phone.replace(/^0+/, '')}`;
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: FROM_NUMBER!, Body: body }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      await logMessage({ patientId, phone, body, status: 'failed', sentBy });
      return { simulated: false, error: data?.message || 'Échec envoi SMS.' };
    }

    await logMessage({ patientId, phone, body, status: 'sent', providerMessageId: data.sid, sentBy });

    return { simulated: false, providerMessageId: data.sid };
  } catch (e) {
    return { simulated: false, error: e instanceof Error ? e.message : 'Erreur réseau.' };
  }
}
