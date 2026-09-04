import 'server-only';
import { sql } from '@/lib/db';

const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID; // ex: "CabinetDentaire"

const PLIVO_AUTH_ID = process.env.PLIVO_AUTH_ID;
const PLIVO_AUTH_TOKEN = process.env.PLIVO_AUTH_TOKEN;
const PLIVO_SRC = process.env.PLIVO_SRC; // numéro Plivo ou expéditeur alphanumérique

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

function isPlivoConfigured() {
  return !!PLIVO_AUTH_ID && !!PLIVO_AUTH_TOKEN && !!PLIVO_SRC;
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
  return isTermiiConfigured() || isPlivoConfigured() || isAfricasTalkingConfigured() || isVonageConfigured() || isTwilioConfigured();
}

interface SendResult {
  simulated: boolean;
  providerMessageId?: string;
  provider?: 'termii' | 'plivo' | 'africastalking' | 'vonage' | 'twilio';
  error?: string;
}

// Numéro au format E.164 (préfixe "+"), requis par les trois fournisseurs
// pour le SMS. Les numéros patients sont souvent saisis sans le "+".
function toE164(phone: string) {
  return phone.startsWith('+') ? phone : `+${phone.replace(/^0+/, '')}`;
}

// URL publique du callback de statut Twilio. Absente en développement local
// (pas d'URL joignable depuis l'extérieur) : l'envoi fonctionne alors sans
// mise à jour de statut.
function statusCallbackUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  return base ? `${base}/api/twilio/status` : null;
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

async function sendViaPlivo(to: string, body: string): Promise<SendResult> {
  const res = await fetch(`https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Message/`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ src: PLIVO_SRC, dst: to.replace('+', ''), text: body }),
  });

  const data = await res.json();

  if (!res.ok || !data?.message_uuid?.[0]) {
    return {
      simulated: false,
      provider: 'plivo',
      error: data?.error || 'Échec envoi SMS (Plivo).',
    };
  }

  return { simulated: false, provider: 'plivo', providerMessageId: data.message_uuid[0] };
}

// Le compte « sandbox » d'Africa's Talking s'ouvre sans vérification
// d'identité et sert à valider le branchement de bout en bout avant
// d'attendre l'ouverture du compte réel. Il vise un autre domaine et
// n'atteint aucun réseau : les messages n'apparaissent que dans le
// simulateur. C'est un banc d'essai, jamais un mode de production.
function isAfricasTalkingSandbox() {
  return AT_USERNAME === 'sandbox';
}

function atBaseUrl() {
  return isAfricasTalkingSandbox()
    ? 'https://api.sandbox.africastalking.com'
    : 'https://api.africastalking.com';
}

// Codes d'acceptation d'Africa's Talking : 100 traité, 101 envoyé, 102 mis
// en file. Tout le reste est un refus, dont le motif est dans `status`.
const AT_CODES_ACCEPTES = [100, 101, 102];

async function sendViaAfricasTalking(to: string, body: string): Promise<SendResult> {
  const parametres = () =>
    new URLSearchParams({
      username: AT_USERNAME!,
      to,
      message: body,
      ...(AT_SENDER_ID ? { from: AT_SENDER_ID } : {}),
    });

  const appel = (chemin: string) =>
    fetch(`${atBaseUrl()}${chemin}`, {
      method: 'POST',
      headers: {
        apiKey: AT_API_KEY!,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: parametres(),
    });

  // Africa's Talking a déplacé l'envoi vers /messaging/bulk ; l'ancien chemin
  // reste servi par une partie des comptes. On tente le chemin courant puis
  // l'ancien : sans ce repli, un compte sur l'ancienne route échouerait sur
  // un 404 dont le motif n'apparaîtrait nulle part dans l'application.
  let res = await appel('/version1/messaging/bulk');
  if (res.status === 404) res = await appel('/version1/messaging');

  // Sur clé invalide ou en-tête manquant, Africa's Talking répond du texte
  // brut, pas du JSON : `res.json()` levait alors une exception qui masquait
  // le motif réel derrière une « erreur réseau ».
  const brut = await res.text();
  let data: { SMSMessageData?: { Message?: string; Recipients?: Record<string, unknown>[] } } | null = null;
  try {
    data = JSON.parse(brut);
  } catch {
    return {
      simulated: false,
      provider: 'africastalking',
      error: `Africa's Talking (HTTP ${res.status}) : ${brut.slice(0, 200) || 'réponse vide'}`,
    };
  }

  const recipient = data?.SMSMessageData?.Recipients?.[0];

  if (!res.ok || !recipient) {
    return {
      simulated: false,
      provider: 'africastalking',
      error:
        data?.SMSMessageData?.Message ||
        `Échec envoi SMS (Africa's Talking, HTTP ${res.status}).`,
    };
  }

  if (!AT_CODES_ACCEPTES.includes(Number(recipient.statusCode))) {
    // Le libellé porte le motif exact du refus (« Invalid Phone Number »,
    // « Insufficient Balance », « Could Not Route »...) : trois situations
    // qui appellent trois corrections différentes côté cabinet.
    return {
      simulated: false,
      provider: 'africastalking',
      error: `Africa's Talking : ${recipient.status || `code ${recipient.statusCode}`}`,
    };
  }

  return {
    simulated: false,
    provider: 'africastalking',
    providerMessageId: recipient.messageId as string,
  };
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
      body: new URLSearchParams({
        To: to,
        From: TWILIO_FROM_NUMBER!,
        Body: body,
        // Twilio accepte la requête puis peut échouer ensuite (numéro
        // invalide, opérateur qui bloque) : ce callback met à jour le
        // statut réel du message en base.
        ...(statusCallbackUrl() ? { StatusCallback: statusCallbackUrl()! } : {}),
      }),
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
  errorDetail?: string | null;
}) {
  await sql`
    insert into patient_messages (patient_id, phone, channel, direction, body, status, provider_message_id, sent_by, error_detail)
    values (${params.patientId ?? null}, ${params.phone}, 'sms', 'outbound', ${params.body}, ${params.status}, ${params.providerMessageId ?? null}, ${params.sentBy ?? null}, ${params.errorDetail?.slice(0, 300) ?? null})
  `;
}

// Envoie un SMS via Termii, Plivo, Africa's Talking, Vonage ou Twilio, dans
// cet ordre de priorité selon les clés configurées (le premier fournisseur
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
      : isPlivoConfigured()
      ? await sendViaPlivo(to, body)
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
      errorDetail: result.error ?? null,
    });

    return result;
  } catch (e) {
    const motif = e instanceof Error ? e.message : 'Erreur réseau.';
    // Un envoi qui échoue avant d'avoir atteint le fournisseur (DNS, TLS,
    // délai dépassé) ne laissait aucune trace : le message disparaissait de
    // la messagerie du patient comme s'il n'avait jamais été tenté. Le
    // cabinet ne pouvait donc ni le voir échouer, ni le relancer.
    try {
      await logMessage({ patientId, phone, body, status: 'failed', sentBy, errorDetail: motif });
    } catch {
      /* la base est peut-être elle-même la cause de l'échec */
    }
    return { simulated: false, error: motif };
  }
}
