import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';
import { sendSms, isSmsConfigured } from '@/lib/integrations/sms';
import { preparerEnvoiManuel } from '@/lib/integrations/envoi-manuel';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;
const BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

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

  // L'app Meta du cabinet est aussi rattachée au compte WhatsApp "bac à
  // sable" de Meta (numéro de test américain). Sans ce filtre, les messages
  // envoyés à ce numéro de test atterriraient dans la messagerie des vrais
  // patients. On n'accepte donc que le compte WhatsApp Business du cabinet.
  const entries = (payload?.entry || []).filter(
    (entry: any) => !BUSINESS_ACCOUNT_ID || String(entry?.id) === BUSINESS_ACCOUNT_ID
  );

  // Accusés de livraison Meta. Sans ce traitement, l'application marquait
  // "sent" dès que Meta acceptait la requête : or Meta accepte puis rejette
  // de façon asynchrone (typiquement 131047, hors fenêtre de 24h sans
  // modèle approuvé). Le cabinet croyait donc ses rappels distribués.
  const statuses =
    entries.flatMap((entry: any) =>
      entry?.changes?.flatMap((change: any) => change?.value?.statuses || [])
    ) || [];

  for (const st of statuses) {
    const mapped = STATUS_MAP[st.status] || null;
    if (!mapped || !st.id) continue;
    const detail = st.errors?.[0]
      ? `${st.errors[0].code} ${st.errors[0].title || st.errors[0].message || ''}`.trim()
      : null;
    const rows = await sql`
      update patient_messages
      set status = ${mapped},
          error_detail = coalesce(${detail}, error_detail)
      where provider_message_id = ${st.id}
      returning id, patient_id, phone, body, fallback_of
    `;

    // Repli SMS. Meta accepte la requête puis rejette la livraison : l'échec
    // n'arrive qu'ici, par webhook, bien après l'appel. Sans ce rattrapage, le
    // message de bienvenue et la confirmation de rendez-vous n'atteignaient
    // jamais un nouveau patient — n'ayant par définition jamais écrit au
    // cabinet, il est toujours hors de la fenêtre de 24h que Meta impose au
    // texte libre (erreur 131047).
    const msg = rows[0];
    if (mapped === 'failed' && msg && !msg.fallback_of && msg.phone && msg.body) {
      // Un seul rattrapage par message : `fallback_of` marque le SMS déjà
      // émis, et sa présence empêche toute nouvelle tentative.
      const dejaRepris = await sql`
        select 1 from patient_messages where fallback_of = ${msg.id} limit 1
      `;
      // Le SMS doit partir vers la LIGNE D'APPEL du patient, pas vers celle
      // enregistrée sur le message WhatsApp : quand les deux diffèrent, le
      // repli visait la ligne WhatsApp, qui ne reçoit pas forcément de SMS.
      const lignes = msg.patient_id
        ? await sql`select phone from patients where id = ${msg.patient_id} limit 1`
        : [];
      const numeroSms = (lignes[0]?.phone as string | undefined) || (msg.phone as string);

      if (dejaRepris.length === 0) {
        const envoi = isSmsConfigured()
          ? await sendSms({
              patientId: msg.patient_id as string | null,
              phone: numeroSms,
              body: msg.body as string,
            })
          : { error: 'aucun fournisseur SMS configuré' };

        if (isSmsConfigured()) {
          await sql`
            update patient_messages
            set fallback_of = ${msg.id}
            where id = (
              select id from patient_messages
              where phone = ${numeroSms} and channel = 'sms' and fallback_of is null
              order by created_at desc limit 1
            )
          `;
        }

        if (envoi.error) {
          // On ajoute le motif du repli SANS écraser celui de Meta : sinon
          // le code d'origine (131042, 131047...) disparaît, et c'est
          // précisément lui qui indique quoi corriger côté compte.
          await sql`
            update patient_messages
            set error_detail = left(
              coalesce(error_detail || ' | ', '') || ${`repli SMS: ${envoi.error}`},
              300
            )
            where id = ${msg.id}
          `;

          // Dernier recours : la file d'envoi manuel.
          //
          // C'est ici, et pas dans notifyPatient, que se joue le cas le plus
          // fréquent. Meta accepte la requête (HTTP 200) puis rejette la
          // livraison par webhook : pour notifyPatient l'envoi a donc réussi,
          // il ne déclenche aucun repli et rien n'atteint la file. Vérifié en
          // production sur une confirmation de rendez-vous refusée en 131042
          // — les deux canaux échouaient et le message ne réapparaissait
          // nulle part. Le rappel était perdu en silence.
          try {
            await preparerEnvoiManuel({
              patientId: msg.patient_id as string | null,
              numero: msg.phone as string,
              canal: 'whatsapp',
              body: msg.body as string,
            });
          } catch {
            /* la file est un filet ; son échec ne doit pas rompre le webhook */
          }
        }
      }
    }
  }

  const messages =
    entries.flatMap((entry: any) =>
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
