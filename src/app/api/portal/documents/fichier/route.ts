import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { chargerPatientDuPortail } from '@/lib/portal-guard';
import { servirFichier } from '@/lib/fichiers';

export const dynamic = 'force-dynamic';

// Lecture d'un document depuis le portail patient.
//
// Deux conditions, et pas une de moins : le document appartient au dossier du
// patient connecté, et il lui est destiné — soit le cabinet l'a partagé, soit
// c'est lui qui l'a déposé. Un identifiant deviné ne donne donc rien, pas même
// un document du même dossier laissé en interne.
export async function GET(request: Request) {
  const { patientId, erreur, ...reste } = await chargerPatientDuPortail();
  if (erreur) {
    return NextResponse.json({ error: erreur }, { status: (reste as { statut: number }).statut });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id est requis.' }, { status: 400 });

  const rows = await sql`
    select blob_url, mime_type, file_name
    from patient_documents
    where id = ${id}
      and patient_id = ${patientId}
      and (visible_to_patient = true or uploaded_by_patient = true)
    limit 1
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });
  }

  return servirFichier(rows[0].blob_url as string, {
    mime: rows[0].mime_type as string | null,
    nomFichier: rows[0].file_name as string | null,
  });
}
