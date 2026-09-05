import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

// Droit à l'oubli : anonymise l'identité du patient (nom, dates, téléphones,
// adresse, identifiant national) tout en conservant la ligne et son
// dossier_number, pour préserver l'intégrité référentielle avec l'historique
// clinique/financier (factures, actes, rendez-vous) soumis à des obligations
// légales de conservation des dossiers de santé — pas de suppression brute.
//
// CE QUI RESTE, ET POURQUOI : allergies, antécédents et notes cliniques sont
// des pièces du dossier de soins, soumises à la même obligation de
// conservation que les actes. Détachées de toute identité, elles ne désignent
// plus personne. Les supprimer reviendrait à détruire le dossier médical, ce
// que le droit à l'oubli ne demande pas.
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
      -- Ajoutée par la migration 0027, APRÈS l'écriture de cette route : la
      -- ligne d'appel était effacée, pas la ligne WhatsApp. Un numéro de
      -- téléphone reste une identité directe.
      whatsapp_phone = null,
      address = null,
      national_id = null,
      status = 'anonymized',
      updated_at = now()
    where id = ${params.id}
    returning id, dossier_number, status
  `;

  await sql`delete from patient_portal_tokens where patient_id = ${params.id}`;

  // Historique de messagerie : il porte le numéro du patient ET son nom en
  // clair dans le corps (« Bonjour Untel, votre rendez-vous… »). Vérifié : un
  // dossier anonymisé restait entièrement reconstituable à partir de ces
  // lignes, ce qui vidait l'anonymisation de son sens.
  //
  // Ce ne sont pas des pièces du dossier de soins — ce sont des accusés
  // d'envoi. Rien n'impose de les conserver, contrairement aux actes, aux
  // factures et aux notes cliniques, qui restent attachés au dossier
  // anonymisé pour satisfaire l'obligation de conservation.
  await sql`delete from patient_messages where patient_id = ${params.id}`;
  await sql`delete from scheduled_messages where patient_id = ${params.id}`;

  await recordAudit({
    actorId: session!.userId,
    action: 'Anonymisation dossier patient (droit à l\'oubli)',
    entityTable: 'patients',
    entityId: params.id,
    meta: { dossierNumber: existing[0].dossier_number },
  });

  return NextResponse.json({ patient: rows[0] });
}
