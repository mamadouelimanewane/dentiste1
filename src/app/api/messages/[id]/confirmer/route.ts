import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// Confirmation qu'un message préparé a bien été envoyé à la main.
//
// C'est une déclaration humaine, pas un accusé de réception d'opérateur : la
// colonne `envoi_manuel` reste vraie pour que l'historique ne laisse jamais
// croire qu'un fournisseur a constaté la livraison. Le statut ne peut pas
// aller au-delà de 'sent' — « remis au patient » ne se déclare pas, cela se
// constate, et personne ici ne peut le constater.
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { session, error, status } = await requirePermission(18, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  // La confirmation ne vaut que pour un message effectivement en attente :
  // sans ce filtre, un appel répété pourrait réécrire le statut d'un message
  // déjà parti par un fournisseur, et effacer un échec constaté.
  const rows = await sql`
    update patient_messages
    set status = 'sent'::message_status,
        sent_by = ${session!.userId}
    where id = ${params.id}
      and envoi_manuel = true
      and status = 'a_envoyer'::message_status
    returning id, patient_id, phone, channel
  `;

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Ce message n'est pas en attente d'envoi manuel." },
      { status: 409 }
    );
  }

  return NextResponse.json({ message: rows[0] });
}
