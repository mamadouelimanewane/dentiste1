import 'server-only';
import { sql } from '@/lib/db';

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

export function isWhatsAppConfigured() {
  return isMetaConfigured() || isTwilioWhatsAppConfigured();
}

function isMetaConfigured() {
  return !!ACCESS_TOKEN && !!PHONE_NUMBER_ID;
}

function isTwilioWhatsAppConfigured() {
  return !!TWILIO_ACCOUNT_SID && !!TWILIO_AUTH_TOKEN && !!TWILIO_WHATSAPP_FROM;
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

async function sendViaMeta(phone: string, body: string): Promise<SendResult> {
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
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
    });
    const data = await res.json();
    if (!res.ok) {
      return { simulated: false, error: data?.error?.message || 'Échec envoi WhatsApp (Meta).' };
    }
    return { simulated: false, providerMessageId: data?.messages?.[0]?.id };
  } catch (e) {
    return { simulated: false, error: e instanceof Error ? e.message : 'Erreur réseau (Meta).' };
  }
}

// Twilio WhatsApp (Sandbox ou numéro WhatsApp validé) : même API que le SMS,
// juste préfixée "whatsapp:". Le destinataire doit avoir rejoint le Sandbox
// (message "join <code>" envoyé au numéro Twilio) tant que le compte est en
// mode d'essai.
async function sendViaTwilio(phone: string, body: string): Promise<SendResult> {
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: `whatsapp:${phone}`,
          From: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
          Body: body,
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { simulated: false, error: data?.message || 'Échec envoi WhatsApp (Twilio).' };
    }
    return { simulated: false, providerMessageId: data.sid };
  } catch (e) {
    return { simulated: false, error: e instanceof Error ? e.message : 'Erreur réseau (Twilio).' };
  }
}

// Envoie un message WhatsApp — via l'API Cloud Meta si configurée, sinon via
// Twilio WhatsApp (Sandbox) si configuré, sinon journalise en mode simulé.
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

  const result = isMetaConfigured() ? await sendViaMeta(phone, body) : await sendViaTwilio(phone, body);

  await logMessage({
    patientId,
    phone,
    body,
    status: result.error ? 'failed' : 'sent',
    providerMessageId: result.providerMessageId,
    sentBy,
  });

  return result;
}
