import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { normaliserTelephone, validerTelephone, bornerTexte } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// Préparation d'un message à envoyer à la main.
//
// Aucun fournisseur d'envoi automatique n'est ouvert au cabinet (voir la
// migration 0028). Plutôt que de bloquer la mise en service, l'application
// prépare le texte et ouvre WhatsApp dessus sur le téléphone du cabinet :
// l'assistante appuie sur envoyer. Le message part réellement.
//
// Ce que cette route ne fait PAS : prétendre que le message est parti. Elle
// l'enregistre en 'a_envoyer'. Tant que personne n'a confirmé, l'historique
// du patient montre qu'il attend — jamais qu'il a été prévenu.

const LONGUEUR_MAX = 1000;

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(18, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId, phone, message, channel } = body as {
    patientId?: string;
    phone?: string;
    message?: string;
    channel?: 'whatsapp' | 'sms';
  };

  const texte = bornerTexte(message, LONGUEUR_MAX);
  if (!texte) {
    return NextResponse.json({ error: 'Le message est vide.' }, { status: 400 });
  }

  const canal = channel === 'sms' ? 'sms' : 'whatsapp';

  // Le numéro vient du dossier quand on connaît le patient : celui transmis
  // par le navigateur pourrait avoir été modifié en chemin, et un message de
  // santé adressé au mauvais numéro ne se rattrape pas. WhatsApp et SMS ne
  // sont pas forcément sur la même ligne — on prend celle du canal choisi.
  let destinataire = phone;
  if (patientId) {
    const lignes = await sql`
      select phone, whatsapp_phone from patients where id = ${patientId} limit 1
    `;
    if (!lignes[0]) {
      return NextResponse.json({ error: 'Patient introuvable.' }, { status: 404 });
    }
    destinataire =
      canal === 'whatsapp'
        ? (lignes[0].whatsapp_phone as string) || (lignes[0].phone as string)
        : (lignes[0].phone as string);
  }

  const verif = validerTelephone(destinataire);
  if (!verif.ok) return NextResponse.json({ error: verif.erreur }, { status: 400 });
  if (!verif.valeur) {
    return NextResponse.json(
      { error: "Aucun numéro enregistré pour ce patient sur ce canal." },
      { status: 400 }
    );
  }

  const numero = verif.valeur;

  const rows = await sql`
    insert into patient_messages
      (patient_id, phone, channel, direction, body, status, sent_by, envoi_manuel)
    values (
      ${patientId ?? null}, ${numero}, ${canal}, 'outbound', ${texte},
      'a_envoyer'::message_status, ${session!.userId}, true
    )
    returning id
  `;

  // wa.me attend le numéro international sans « + » ni séparateur. Le lien
  // ouvre WhatsApp — application mobile ou WhatsApp Web — sur la conversation
  // du patient, message déjà saisi.
  const lien =
    canal === 'whatsapp'
      ? `https://wa.me/${normaliserTelephone(numero).replace(/^\+/, '')}?text=${encodeURIComponent(texte)}`
      : `sms:${numero}?body=${encodeURIComponent(texte)}`;

  return NextResponse.json({ id: rows[0].id, lien, canal, numero });
}
