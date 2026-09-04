import 'server-only';
import { sql } from '@/lib/db';
import { normaliserTelephone } from '@/lib/validation';

// File d'attente des messages à envoyer à la main.
//
// Aucun fournisseur d'envoi automatique n'est ouvert au cabinet (voir la
// migration 0028). Les rappels de rendez-vous partaient donc dans le vide :
// le cron tentait WhatsApp puis SMS, échouait sur les deux, enregistrait
// « échec » — et personne n'était jamais invité à les envoyer. Le cabinet
// n'avait pas de fonction rappel du tout, sans que rien ne le signale.
//
// Un message qu'aucun canal n'a pu porter atterrit désormais ici, en
// 'a_envoyer'. L'assistante ouvre la file, envoie depuis le téléphone du
// cabinet, et confirme. Deux minutes pour une dizaine de rappels.

export interface EnvoiPrepare {
  id: string;
  lien: string;
  numero: string;
  canal: 'whatsapp' | 'sms';
}

// wa.me attend le numéro international sans « + » ni séparateur, et ouvre
// l'application mobile comme WhatsApp Web sur la conversation du patient,
// message déjà saisi. Le lien `sms:` fait l'équivalent sur un téléphone.
export function lienEnvoi(canal: 'whatsapp' | 'sms', numero: string, texte: string) {
  return canal === 'whatsapp'
    ? `https://wa.me/${normaliserTelephone(numero).replace(/^\+/, '')}?text=${encodeURIComponent(texte)}`
    : `sms:${numero}?body=${encodeURIComponent(texte)}`;
}

export async function preparerEnvoiManuel(params: {
  patientId?: string | null;
  numero: string;
  canal: 'whatsapp' | 'sms';
  body: string;
  sentBy?: string | null;
}): Promise<EnvoiPrepare> {
  const rows = await sql`
    insert into patient_messages
      (patient_id, phone, channel, direction, body, status, sent_by, envoi_manuel)
    values (
      ${params.patientId ?? null}, ${params.numero}, ${params.canal}, 'outbound',
      ${params.body}, 'a_envoyer'::message_status, ${params.sentBy ?? null}, true
    )
    returning id
  `;

  return {
    id: rows[0].id as string,
    lien: lienEnvoi(params.canal, params.numero, params.body),
    numero: params.numero,
    canal: params.canal,
  };
}
