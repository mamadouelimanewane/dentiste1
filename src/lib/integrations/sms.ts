import 'server-only';
import { sql } from '@/lib/db';

// Orange Sénégal (developer.orange.com, API « SMS Senegal 2.0 »).
//
// Placé en tête de la chaîne : c'est le seul fournisseur local. Sonatel livre
// directement sur son réseau et par interconnexion vers Free/Yas et Expresso
// — la documentation Orange précise « Only in and to Senegal, any operator ».
//
// Surtout, c'est le seul dont l'accès ne passe pas par une vérification
// d'identité internationale : les forfaits se paient en **Airtime ou Orange
// Money**, sans carte bancaire ni reconnaissance faciale. Twilio, Meta,
// Africa's Talking et Anthropic ont tous bloqué le cabinet sur ce point.
const ORANGE_CLIENT_ID = process.env.ORANGE_SMS_CLIENT_ID;
const ORANGE_CLIENT_SECRET = process.env.ORANGE_SMS_CLIENT_SECRET;
const ORANGE_SENDER = process.env.ORANGE_SMS_SENDER; // ligne Orange du cabinet, ex: +221771234567
const ORANGE_SENDER_NAME = process.env.ORANGE_SMS_SENDER_NAME; // optionnel, à faire enregistrer

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

function isOrangeConfigured() {
  return !!ORANGE_CLIENT_ID && !!ORANGE_CLIENT_SECRET && !!ORANGE_SENDER;
}

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
  return (
    isOrangeConfigured() ||
    isTermiiConfigured() ||
    isPlivoConfigured() ||
    isAfricasTalkingConfigured() ||
    isVonageConfigured() ||
    isTwilioConfigured()
  );
}

interface SendResult {
  simulated: boolean;
  providerMessageId?: string;
  provider?: 'orange' | 'termii' | 'plivo' | 'africastalking' | 'vonage' | 'twilio';
  error?: string;
}

// Numéro au format E.164 (préfixe "+"), requis par les trois fournisseurs
// pour le SMS. Les numéros patients sont souvent saisis sans le "+".
function toE164(phone: string) {
  return phone.startsWith('+') ? phone : `+${phone.replace(/^0+/, '')}`;
}

// ─── Longueur et encodage des SMS ────────────────────────────────────────
//
// Un SMS ne transporte 160 caractères que dans l'alphabet GSM-7. Un seul
// caractère en dehors — un emoji, un tiret cadratin, un « ô » — bascule le
// message entier en UCS-2, où un segment ne porte plus que 70 caractères
// (67 en concaténé). Les longs messages deviennent alors une dizaine de
// segments, que les opérateurs sénégalais rejettent.
//
// Constaté en production sur la ligne +221777529288 : deux messages de 108
// et 117 caractères sans emoji ont été LIVRÉS, tandis qu'un message de 302
// caractères (erreur 30454) et un de 671 (erreur 30044) — tous deux portant
// l'emoji 🦷 — ont été refusés. L'emoji reste sur WhatsApp, où il ne coûte
// rien ; il est retiré du seul canal qui en souffre.

const GSM7 =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
// Ces caractères existent en GSM-7 mais comptent double (séquence d'échappement).
const GSM7_EXT = '^{}\\[~]|€';

const GSM7_SEGMENT_SIMPLE = 160;
const GSM7_SEGMENT_CONCAT = 153;
// Au-delà, on n'envoie pas : mieux vaut un message remis à l'assistante
// qu'un message tronqué ou refusé par l'opérateur.
const SMS_SEGMENTS_MAX = 3;

export function versGsm7(texte: string) {
  const equivalents: Record<string, string> = {
    '—': '-', '–': '-', '’': "'", '‘': "'", '“': '"', '”': '"',
    '…': '...', '«': '"', '»': '"', ' ': ' ', ' ': ' ',
  };

  const sortie = texte
    .replace(/[—–’‘“”…«»  ]/g, (c) => equivalents[c] ?? c)
    .split('')
    .map((c) => {
      if (GSM7.includes(c) || GSM7_EXT.includes(c)) return c;
      // Sans cette équivalence, « N°SN-10063-X » deviendrait « NSN-10063-X » :
      // le numéro de dossier changerait de forme sans que rien ne le signale.
      if (c === '°') return 'o';
      // « ô », « ê », « î » ne sont pas en GSM-7 : on les déaccentue plutôt
      // que de faire basculer tout le message en UCS-2.
      // Plage des diacritiques combinants (U+0300–U+036F) : `\p{M}` exigerait
      // une cible ES6, que ce projet ne vise pas.
      const sansAccent = c.normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (sansAccent.length === 1 && GSM7.includes(sansAccent)) return sansAccent;
      // Emoji et symboles non transposables : retirés.
      return '';
    })
    .join('');

  // Le retrait d'un emoji laisse souvent une double espace derrière lui.
  return sortie.replace(/[ \t]{2,}/g, ' ').replace(/ +\n/g, '\n').trim();
}

export function segmentsSms(texte: string) {
  const unites = texte
    .split('')
    .reduce((n, c) => n + (GSM7_EXT.includes(c) ? 2 : 1), 0);
  return unites <= GSM7_SEGMENT_SIMPLE ? 1 : Math.ceil(unites / GSM7_SEGMENT_CONCAT);
}

// URL publique du callback de statut Twilio. Absente en développement local
// (pas d'URL joignable depuis l'extérieur) : l'envoi fonctionne alors sans
// mise à jour de statut.
function statusCallbackUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  return base ? `${base}/api/twilio/status` : null;
}

// Jeton OAuth2 Orange, valable environ une heure. Conservé en mémoire du
// processus : sans ce cache, chaque SMS coûterait un aller-retour
// d'authentification supplémentaire. Une instance serverless froide le
// redemande, ce qui est sans conséquence.
let jetonOrange: { valeur: string; expire: number } | null = null;

async function jetonOrangeValide(): Promise<{ jeton?: string; error?: string }> {
  // Marge d'une minute : un jeton qui expire pendant la requête d'envoi
  // produirait un 401 difficile à interpréter côté cabinet.
  if (jetonOrange && jetonOrange.expire > Date.now() + 60_000) {
    return { jeton: jetonOrange.valeur };
  }

  const res = await fetch('https://api.orange.com/oauth/v3/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${ORANGE_CLIENT_ID}:${ORANGE_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
  });

  const brut = await res.text();
  let data: { access_token?: string; expires_in?: number; error_description?: string } | null = null;
  try {
    data = JSON.parse(brut);
  } catch {
    return { error: `Orange (jeton, HTTP ${res.status}) : ${brut.slice(0, 150) || 'réponse illisible'}` };
  }

  if (!res.ok || !data?.access_token) {
    return {
      error:
        data?.error_description ||
        `Orange : authentification refusée (HTTP ${res.status}). Vérifiez ORANGE_SMS_CLIENT_ID et ORANGE_SMS_CLIENT_SECRET.`,
    };
  }

  jetonOrange = {
    valeur: data.access_token,
    expire: Date.now() + (Number(data.expires_in) || 3600) * 1000,
  };
  return { jeton: data.access_token };
}

async function sendViaOrange(to: string, body: string): Promise<SendResult> {
  const auth = await jetonOrangeValide();
  if (!auth.jeton) return { simulated: false, provider: 'orange', error: auth.error };

  // Le numéro expéditeur apparaît deux fois : dans le chemin (encodé) et
  // dans le corps. Orange rejette la requête si les deux diffèrent.
  const expediteur = toE164(ORANGE_SENDER!);
  const chemin = encodeURIComponent(`tel:${expediteur}`);

  const res = await fetch(`https://api.orange.com/smsmessaging/v1/outbound/${chemin}/requests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.jeton}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      outboundSMSMessageRequest: {
        address: `tel:${to}`,
        senderAddress: `tel:${expediteur}`,
        outboundSMSTextMessage: { message: body },
        // Nom d'expéditeur : il doit être enregistré auprès de Sonatel, sinon
        // Orange le remplace par le numéro. On ne l'envoie que s'il est posé.
        ...(ORANGE_SENDER_NAME ? { senderName: ORANGE_SENDER_NAME } : {}),
      },
    }),
  });

  const brut = await res.text();
  let data: Record<string, any> | null = null;
  try {
    data = JSON.parse(brut);
  } catch {
    /* Orange répond parfois en texte brut sur erreur de passerelle */
  }

  if (!res.ok) {
    const motif =
      data?.requestError?.serviceException?.text ||
      data?.requestError?.policyException?.text ||
      brut.slice(0, 150);
    // 403 recouvre à la fois le forfait épuisé et le forfait expiré : ce sont
    // les deux cas que le cabinet doit pouvoir corriger seul, en rachetant un
    // bundle depuis son compte Orange.
    if (res.status === 403) {
      return {
        simulated: false,
        provider: 'orange',
        error: `Orange : forfait SMS épuisé ou expiré. Rachetez un bundle sur developer.orange.com. (${motif})`,
      };
    }
    return {
      simulated: false,
      provider: 'orange',
      error: `Orange (HTTP ${res.status}) : ${motif || 'échec envoi SMS.'}`,
    };
  }

  // La ressource créée porte l'identifiant de la demande en fin d'URL.
  const url: string = data?.outboundSMSMessageRequest?.resourceURL || '';
  return {
    simulated: false,
    provider: 'orange',
    providerMessageId: url.split('/').pop() || undefined,
  };
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

// Envoie un SMS via Orange Sénégal, Termii, Plivo, Africa's Talking, Vonage
// ou Twilio, dans cet ordre de priorité selon les clés configurées (le
// premier fournisseur disponible est utilisé). Orange passe en premier :
// c'est le seul opérateur local, il livre sur les trois réseaux du pays sans
// transiter par un long code étranger, et son accès ne dépend d'aucune
// vérification d'identité internationale. Sans aucune clé, journalise en base
// avec le statut "simulated" au lieu d'appeler le réseau — l'UI affiche un
// badge "Mode démo".
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

  // Le corps est ramené à l'alphabet GSM-7 AVANT l'envoi, et c'est cette
  // version qui est journalisée : l'historique doit montrer ce que le
  // patient a réellement reçu, pas ce qu'on aurait voulu lui envoyer.
  const texteSms = versGsm7(body);
  const segments = segmentsSms(texteSms);

  if (segments > SMS_SEGMENTS_MAX) {
    // On ne tronque pas : couper un plan de soins au milieu d'un montant
    // serait pire que de ne rien envoyer. L'appelant (notifyPatient, ou le
    // repli du webhook) déposera le message en file d'envoi manuel, où
    // WhatsApp le portera sans limite de longueur.
    const motif = `SMS trop long : ${texteSms.length} caractères (${segments} segments, maximum ${SMS_SEGMENTS_MAX}).`;
    await logMessage({ patientId, phone, body: texteSms, status: 'failed', sentBy, errorDetail: motif });
    return { simulated: false, error: motif };
  }

  try {
    const to = toE164(phone);
    const result = isOrangeConfigured()
      ? await sendViaOrange(to, texteSms)
      : isTermiiConfigured()
      ? await sendViaTermii(to, texteSms)
      : isPlivoConfigured()
      ? await sendViaPlivo(to, texteSms)
      : isAfricasTalkingConfigured()
      ? await sendViaAfricasTalking(to, texteSms)
      : isVonageConfigured()
      ? await sendViaVonage(to, texteSms)
      : await sendViaTwilio(to, texteSms);

    await logMessage({
      patientId,
      phone,
      body: texteSms,
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
      await logMessage({ patientId, phone, body: texteSms, status: 'failed', sentBy, errorDetail: motif });
    } catch {
      /* la base est peut-être elle-même la cause de l'échec */
    }
    return { simulated: false, error: motif };
  }
}
