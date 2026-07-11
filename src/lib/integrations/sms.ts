import 'server-only';
import { sql } from '@/lib/db';

const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID; // ex: "CabinetDentaire"

const AT_API_KEY = process.env.AFRICASTALKING_API_KEY;
const AT_USERNAME = process.env.AFRICASTALKING_USERNAME;
const AT_SENDER_ID = process.env.AFRICASTALKING_SENDER_ID; // optionnel

const VONAGE_API_KEY = process.env.VONAGE_API_KEY;
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET;
const VONAGE_FROM = process.env.VONAGE_FROM; // nom d'expéditeur ou numéro

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

function isTermiiConfigured() {
  return !!TERMII_API_KEY;
}

function isAfricasTalkingConfigured() {
  return !!AT_API_KEY && !!AT_USERNAME;
}

function isVonageConfigured() {
  return !!VONAGE_API_KEY && !!VONAGE_API_SECRET;
}

function isTwilioConfigured() {
  return !!TWILIO_ACCOUNT_SID && !!TWILIO_AUTH_TOKEN && !!TWILIO_FROM_NUMBER;
}

export function isSmsConfigured() {
  return isTermiiConfigured() || isAfricasTalkingConfigured() || isVonageConfigured() || isTwilioConfigured();
}

interface SendResult {
  simulated: boolean;
  providerMessageId?: string;
  provider?: 'termii' | 'africastalking' | 'vonage' | 'twilio';
  error?: string;
}

// Numéro au format E.164 (préfixe "+"), requis par les trois fournisseurs
// pour le SMS. Les numéros patients sont souvent saisis sans le "+".
function toE164(phone: string) {
  return phone.startsWith('+') ? phone : `+${phone.replace(/^0+/, '')}`;
}

async function sendViaTermii(to: string, body: string): Promise<SendResult> {
  const res = await fetch('https://api.ng.termii.com/api/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: to.replace('+', ''),
      from: TERMII_SENDER_ID || 'N-Alert',
      sms: body,
      type: 'plain',
      channel: 'generic',
      api_key: TERMII_API_KEY,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data?.message_id) {
    return {
      simulated: false,
      provider: 'termii',
      error: data?.message || 'Échec envoi SMS (Termii).',
    };
  }

  return { simulated: false, provider: 'termii', providerMessageId: data.message_id };
}

async function sendViaAfricasTalking(to: string, body: string): Promise<SendResult> {
  const res = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      apiKey: AT_API_KEY!,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      username: AT_USERNAME!,
      to,
      message: body,
      ...(AT_SENDER_ID ? { from: AT_SENDER_ID } : {}),
    }),
  });

  const data = await res.json();
  const recipient = data?.SMSMessageData?.Recipients?.[0];

  if (!res.ok || !recipient || !recipient.status || !recipient.status.startsWith('Success')) {
    return {
      simulated: false,
      provider: 'africastalking',
      error: recipient?.status || data?.SMSMessageData?.Message || 'Échec envoi SMS (Africa\'s Talking).',
    };
  }

  return { simulated: false, provider: 'africastalking', providerMessageId: recipient.messageId };
}

async function sendViaVonage(to: string, body: string): Promise<SendResult> {
  const res = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      api_key: VONAGE_API_KEY!,
      api_secret: VONAGE_API_SECRET!,
      to: to.replace('+', ''),
      from: VONAGE_FROM || 'CabinetDentaire',
      text: body,
    }),
  });

  const data = await res.json();
  const message = data?.messages?.[0];

  if (!res.ok || !message || message.status !== '0') {
    return {
      simulated: false,
      provider: 'vonage',
      error: message?.['error-text'] || 'Échec envoi SMS (Vonage).',
    };
  }

  return { simulated: false, provider: 'vonage', providerMessageId: message['message-id'] };
}

async function sendViaTwilio(to: string, body: string): Promise<SendResult> {
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER!, Body: body }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return { simulated: false, provider: 'twilio', error: data?.message || 'Échec envoi SMS (Twilio).' };
  }

  return { simulated: false, provider: 'twilio', providerMessageId: data.sid };
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

// Envoie un SMS via Termii, Africa's Talking, Vonage ou Twilio, dans cet
// ordre de priorité selon les clés configurées (le premier fournisseur
// disponible est utilisé). Sans aucune clé, journalise en base avec le
// statut "simulated" au lieu d'appeler le réseau — l'UI affiche un badge
// "Mode démo".
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
    const to = toE164(phone);
    const result = isTermiiConfigured()
      ? await sendViaTermii(to, body)
      : isAfricasTalkingConfigured()
      ? await sendViaAfricasTalking(to, body)
      : isVonageConfigured()
      ? await sendViaVonage(to, body)
      : await sendViaTwilio(to, body);

    await logMessage({
      patientId,
      phone,
      body,
      status: result.error ? 'failed' : 'sent',
      providerMessageId: result.providerMessageId ?? null,
      sentBy,
    });

    return result;
  } catch (e) {
    return { simulated: false, error: e instanceof Error ? e.message : 'Erreur réseau.' };
  }
}
