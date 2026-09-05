import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

// Retrait d'un acte saisi par erreur, avant facturation.
//
// Deux défauts corrigés ici :
//
//   * la route répondait « succès » même quand rien n'avait été supprimé.
//     Un acte déjà rattaché à une facture ne peut pas partir (la clause
//     `invoice_id is null` le protège, à raison), mais l'écran retirait
//     quand même la ligne : le praticien croyait l'acte annulé alors qu'il
//     restait en base et sur la facture ;
//   * la suppression d'un soin réalisé ne laissait aucune trace. Ce qui
//     part du dossier d'un patient doit rester dans le journal.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { session, error, status } = await requirePermission(5, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const supprimes = await sql`
    delete from executed_acts
    where id = ${params.id} and invoice_id is null
    returning id, patient_id, code, label, tooth, price
  `;

  if (supprimes.length === 0) {
    const existe = await sql`select invoice_id from executed_acts where id = ${params.id}`;
    if (existe.length === 0) {
      return NextResponse.json({ error: 'Acte introuvable.' }, { status: 404 });
    }
    return NextResponse.json(
      {
        error:
          "Cet acte est déjà rattaché à une facture : il ne peut plus être retiré du dossier. " +
          'Passez par une correction de la facture.',
      },
      { status: 409 }
    );
  }

  const acte = supprimes[0];
  await recordAudit({
    actorId: session!.userId,
    action: 'Suppression acte réalisé',
    entityTable: 'executed_acts',
    entityId: params.id,
    meta: {
      patientId: acte.patient_id,
      code: acte.code,
      libelle: acte.label,
      dent: acte.tooth,
      prix: Number(acte.price),
    },
  });

  return NextResponse.json({ success: true });
}
