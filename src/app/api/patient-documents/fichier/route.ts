import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { servirFichier } from '@/lib/fichiers';

export const dynamic = 'force-dynamic';

// Seul chemin de lecture d'un document du dossier, côté cabinet. L'URL du
// magasin ne sort plus de l'application (voir src/lib/fichiers.ts) : sans
// cette route et la permission du module 5, le document n'est plus atteignable.
export async function GET(request: Request) {
  const { error, status } = await requirePermission(5, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id est requis.' }, { status: 400 });

  const rows = await sql`
    select blob_url, mime_type, file_name from patient_documents where id = ${id} limit 1
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });
  }

  return servirFichier(rows[0].blob_url as string, {
    mime: rows[0].mime_type as string | null,
    nomFichier: rows[0].file_name as string | null,
  });
}
