import 'server-only';
import { sql } from '@/lib/db';

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export function isWhatsAppConfigured() {
  return !!ACCESS_TOKEN && !!PHONE_NUMBER_ID;
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
    values (${params.patientId ?? null}, ${params.phone}, 'whatsapp', 'outbound', ${params.body}, ${params.status}, ${params.providerMessageId ?? null}, ${params.sentBy ?? null})
  `;
}

// Envoie un message WhatsApp via l'API Cloud Meta. Sans clés configurées,
// journalise directement le message en base avec le statut "simulated" au
// lieu d'appeler le réseau — l'UI affiche alors un badge "Mode démo".
export async function sendWhatsAppMessage(params: {
  patientId?: string | null;
  phone: string;
  body: string;
  sentBy?: string | null;
}): Promise<SendResult> {
  const { patientId, phone, body, sentBy } = params;

  if (!isWhatsAppConfigured()) {
    await logMessage({ patientId, phone, body, status: 'simulated', sentBy });
    return { simulated: true };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      await logMessage({ patientId, phone, body, status: 'failed', sentBy });
      return { simulated: false, error: data?.error?.message || 'Échec envoi WhatsApp.' };
    }

    const providerMessageId = data?.messages?.[0]?.id;
    await logMessage({ patientId, phone, body, status: 'sent', providerMessageId, sentBy });

    return { simulated: false, providerMessageId };
  } catch (e) {
    return { simulated: false, error: e instanceof Error ? e.message : 'Erreur réseau.' };
  }
}
