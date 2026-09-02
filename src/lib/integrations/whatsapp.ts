import 'server-only';
import { sql } from '@/lib/db';

const D360_API_KEY = process.env.D360_API_KEY;

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

export function isWhatsAppConfigured() {
  return isD360Configured() || isMetaConfigured() || isTwilioWhatsAppConfigured();
}

function isD360Configured() {
  return !!D360_API_KEY;
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

// 360dialog (Cloud API) : partenaire technique officiel Meta, même format de
// message que l'API Cloud Meta ci-dessous mais authentifié par une simple
// clé d'API (header D360-API-KEY) sur un compte WhatsApp Business réel —
// pas de Sandbox, pas de code "join" à envoyer.
function statusCallbackUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  return base ? `${base}/api/twilio/status` : null;
}

async function sendVia360dialog(phone: string, body: string): Promise<SendResult> {
  try {
    const res = await fetch('https://waba-v2.360dialog.io/messages', {
      method: 'POST',
      headers: {
        'D360-API-KEY': D360_API_KEY!,
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
      return { simulated: false, error: data?.error?.message || data?.meta?.developer_message || 'Échec envoi WhatsApp (360dialog).' };
    }
    return { simulated: false, providerMessageId: data?.messages?.[0]?.id };
  } catch (e) {
    return { simulated: false, error: e instanceof Error ? e.message : 'Erreur réseau (360dialog).' };
  }
}

// Modèle approuvé utilisé pour les messages à l'initiative du cabinet
// (rappels de rendez-vous). Meta refuse tout texte libre envoyé hors de la
// fenêtre de 24h suivant le dernier message du patient (erreur 131047) :
// un rappel de rendez-vous, par définition non sollicité, tombe toujours
// dans ce cas. Tant qu'aucun modèle n'est renseigné, l'envoi retombe sur du
// texte libre — qui ne sera distribué que si le patient a écrit récemment.
const REMINDER_TEMPLATE = process.env.WHATSAPP_REMINDER_TEMPLATE;
const REMINDER_TEMPLATE_LANG = process.env.WHATSAPP_REMINDER_TEMPLATE_LANG || 'fr';

export function isWhatsAppTemplateConfigured() {
  return isMetaConfigured() && !!REMINDER_TEMPLATE;
}

async function sendTemplateViaMeta(phone: string, params: string[]): Promise<SendResult> {
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
        type: 'template',
        template: {
          name: REMINDER_TEMPLATE,
          language: { code: REMINDER_TEMPLATE_LANG },
          components: params.length
            ? [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }]
            : [],
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { simulated: false, error: data?.error?.message || 'Échec envoi modèle WhatsApp (Meta).' };
    }
    return { simulated: false, providerMessageId: data?.messages?.[0]?.id };
  } catch (e) {
    return { simulated: false, error: e instanceof Error ? e.message : 'Erreur réseau (Meta).' };
  }
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
          // Indispensable avec le Sandbox WhatsApp : Twilio accepte la
          // requête puis rejette la livraison (erreur 63015) si le
          // destinataire n'a pas rejoint le Sandbox. Sans ce callback, le
          // message restait affiché comme "envoyé".
          ...(statusCallbackUrl() ? { StatusCallback: statusCallbackUrl()! } : {}),
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

// Envoie une note vocale WhatsApp (média) — uniquement via Twilio, qui
// accepte une MediaUrl publique. Meta Cloud API nécessite un upload de média
// séparé, non implémenté ici (mode simulé si seul Meta est configuré).
async function sendVoiceNoteViaTwilio(phone: string, mediaUrl: string): Promise<SendResult> {
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
          MediaUrl: mediaUrl,
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { simulated: false, error: data?.message || 'Échec envoi note vocale (Twilio).' };
    }
    return { simulated: false, providerMessageId: data.sid };
  } catch (e) {
    return { simulated: false, error: e instanceof Error ? e.message : 'Erreur réseau (Twilio).' };
  }
}

export async function sendWhatsAppVoiceNote(params: {
  patientId?: string | null;
  phone: string;
  mediaUrl: string;
  sentBy?: string | null;
}): Promise<SendResult> {
  const { patientId, phone, mediaUrl, sentBy } = params;

  if (!isTwilioWhatsAppConfigured()) {
    await sql`
      insert into patient_messages (patient_id, phone, channel, direction, body, status, sent_by, media_url, media_type)
      values (${patientId ?? null}, ${phone}, 'whatsapp', 'outbound', '[Note vocale]', 'simulated', ${sentBy ?? null}, ${mediaUrl}, 'audio/webm')
    `;
    return { simulated: true };
  }

  const result = await sendVoiceNoteViaTwilio(phone, mediaUrl);

  await sql`
    insert into patient_messages (patient_id, phone, channel, direction, body, status, provider_message_id, sent_by, media_url, media_type)
    values (${patientId ?? null}, ${phone}, 'whatsapp', 'outbound', '[Note vocale]', ${result.error ? 'failed' : 'sent'}, ${result.providerMessageId ?? null}, ${sentBy ?? null}, ${mediaUrl}, 'audio/webm')
  `;

  return result;
}

// Envoie un message WhatsApp — priorité 360dialog > Meta Cloud API > Twilio
// (Sandbox), le premier fournisseur configuré étant utilisé ; sinon
// journalise en mode simulé.
export async function sendWhatsAppMessage(params: {
  patientId?: string | null;
  phone: string;
  body: string;
  sentBy?: string | null;
  // Renseigné par les envois à l'initiative du cabinet (rappels) : les
  // valeurs qui alimentent les variables du modèle approuvé, dans l'ordre.
  templateParams?: string[];
}): Promise<SendResult> {
  const { patientId, phone, body, sentBy, templateParams } = params;

  if (!isWhatsAppConfigured()) {
    await logMessage({ patientId, phone, body, status: 'simulated', sentBy });
    return { simulated: true };
  }

  const useTemplate = !!templateParams && isWhatsAppTemplateConfigured() && !isD360Configured();

  const result = useTemplate
    ? await sendTemplateViaMeta(phone, templateParams!)
    : isD360Configured()
    ? await sendVia360dialog(phone, body)
    : isMetaConfigured()
    ? await sendViaMeta(phone, body)
    : await sendViaTwilio(phone, body);

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
