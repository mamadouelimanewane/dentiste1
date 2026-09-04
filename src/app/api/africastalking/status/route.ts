import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Accusés de réception Africa's Talking.
//
// Africa's Talking accepte un SMS puis en rend compte plus tard, séparément :
// « Success » quand l'opérateur l'a remis au téléphone, « Rejected » ou
// « Failed » quand il ne l'a pas fait. Sans ce point d'entrée, l'application
// s'arrêtait à l'acceptation et laissait chaque message affiché « envoyé »
// à vie — y compris un rappel de rendez-vous refusé par Orange. Le cabinet
// croyait le patient prévenu.
//
// AUTHENTIFICATION — Africa's Talking, contrairement à Twilio et à Meta, ne
// signe pas ses rappels. Le seul élément qu'on maîtrise est l'URL déclarée
// dans leur tableau de bord : on y place un jeton, et toute requête qui ne le
// porte pas est refusée. Sans cela, n'importe qui connaissant l'adresse
// pourrait marquer « livrés » des messages jamais partis.
const CALLBACK_TOKEN = process.env.AFRICASTALKING_CALLBACK_TOKEN;

// Correspondance vers l'enum message_status de la base.
const STATUS_MAP: Record<string, string> = {
  Sent: 'sent',
  Submitted: 'sent',
  Buffered: 'sent',
  Success: 'delivered',
  Rejected: 'failed',
  Failed: 'failed',
};

function jetonValide(request: Request) {
  if (!CALLBACK_TOKEN) return false;
  const fourni = new URL(request.url).searchParams.get('token') || '';
  try {
    return crypto.timingSafeEqual(Buffer.from(fourni), Buffer.from(CALLBACK_TOKEN));
  } catch {
    // Longueurs différentes : timingSafeEqual lève plutôt que de comparer.
    return false;
  }
}

export async function POST(request: Request) {
  if (!CALLBACK_TOKEN) {
    // Fermé par défaut : un rappel non authentifiable ne doit jamais pouvoir
    // modifier un statut de message.
    return new NextResponse('Not configured', { status: 404 });
  }
  if (!jetonValide(request)) {
    return new NextResponse('Invalid token', { status: 401 });
  }

  // Africa's Talking poste en formulaire encodé, pas en JSON.
  const form = await request.formData();
  const id = String(form.get('id') || '');
  const statut = String(form.get('status') || '');

  if (!id || !statut) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  const mapped = STATUS_MAP[statut];
  if (!mapped) {
    // Statut inconnu ou intermédiaire : on accuse réception sans rien écrire,
    // sinon Africa's Talking rejoue le rappel indéfiniment.
    return new NextResponse('OK', { status: 200 });
  }

  // Motif de l'échec (InsufficientCredit, InvalidPhoneNumber, UserInBlackList,
  // DeliveryFailure...). C'est lui qui indique quoi corriger : recharger le
  // compte, corriger le numéro au dossier, ou renoncer à ce destinataire.
  const raison = String(form.get('failureReason') || '').trim();
  const detail = raison ? `Africa's Talking : ${raison}`.slice(0, 300) : null;

  await sql`
    update patient_messages
    set status = ${mapped}::message_status,
        error_detail = coalesce(${detail}, error_detail)
    where provider_message_id = ${id}
  `;

  return new NextResponse('OK', { status: 200 });
}
