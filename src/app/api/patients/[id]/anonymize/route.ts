import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

// Droit à l'oubli : anonymise l'identité du patient (nom, téléphone,
// adresse, identifiant national) tout en conservant la ligne et son
// dossier_number, pour préserver l'intégrité référentielle avec l'historique
// clinique/financier (factures, actes, rendez-vous) soumis à des obligations
// légales de conservation des dossiers de santé — pas de suppression brute.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { session, error, status } = await requirePermission(20, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const existing = await sql`select full_name, dossier_number from patients where id = ${params.id}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Patient introuvable.' }, { status: 404 });
  }
  if (existing[0].full_name === 'Patient anonymisé') {
    return NextResponse.json({ error: 'Ce dossier est déjà anonymisé.' }, { status: 400 });
  }

  const rows = await sql`
    update patients set
      full_name = 'Patient anonymisé',
      birth_date = null,
      phone = null,
      address = null,
      national_id = null,
      status = 'anonymized',
      updated_at = now()
    where id = ${params.id}
    returning id, dossier_number, status
  `;

  await sql`delete from patient_portal_tokens where patient_id = ${params.id}`;

  await recordAudit({
    actorId: session!.userId,
    action: 'Anonymisation dossier patient (droit à l\'oubli)',
    entityTable: 'patients',
    entityId: params.id,
    meta: { dossierNumber: existing[0].dossier_number },
  });

  return NextResponse.json({ patient: rows[0] });
}
