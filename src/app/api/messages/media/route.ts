import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { servirFichier } from '@/lib/fichiers';

export const dynamic = 'force-dynamic';

// Pièce jointe d'un message (note vocale du patient, essentiellement), côté
// cabinet. Comme pour les clichés et les documents, l'URL du magasin ne sort
// plus de l'application : la voix d'un patient décrivant sa douleur est une
// donnée de santé, pas un lien à faire circuler.
export async function GET(request: Request) {
  const { error, status } = await requirePermission(18, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id est requis.' }, { status: 400 });

  const rows = await sql`
    select media_url, media_type from patient_messages where id = ${id} limit 1
  `;
  if (rows.length === 0 || !rows[0].media_url) {
    return NextResponse.json({ error: 'Pièce jointe introuvable.' }, { status: 404 });
  }

  return servirFichier(rows[0].media_url as string, {
    mime: rows[0].media_type as string | null,
    nomFichier: 'note-vocale.webm',
  });
}
