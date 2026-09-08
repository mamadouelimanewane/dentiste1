import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { chargerPatientDuPortail } from '@/lib/portal-guard';
import { servirFichier } from '@/lib/fichiers';

export const dynamic = 'force-dynamic';

// Pièce jointe d'un message, côté patient : il ne peut réécouter que ce qui
// appartient à son propre dossier.
export async function GET(request: Request) {
  const acces = await chargerPatientDuPortail();
  if (acces.erreur) {
    return NextResponse.json({ error: acces.erreur }, { status: acces.statut });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id est requis.' }, { status: 400 });

  const rows = await sql`
    select media_url, media_type
    from patient_messages
    where id = ${id} and patient_id = ${acces.patientId}
    limit 1
  `;
  if (rows.length === 0 || !rows[0].media_url) {
    return NextResponse.json({ error: 'Pièce jointe introuvable.' }, { status: 404 });
  }

  return servirFichier(rows[0].media_url as string, {
    mime: rows[0].media_type as string | null,
    nomFichier: 'note-vocale.webm',
  });
}
