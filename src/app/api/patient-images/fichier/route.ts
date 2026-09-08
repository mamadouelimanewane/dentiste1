import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { servirFichier } from '@/lib/fichiers';

export const dynamic = 'force-dynamic';

// Seul chemin de lecture d'un cliché. Module 14 comme le reste de l'imagerie :
// une radiographie n'est pas visible du rôle comptable, et elle ne l'est plus
// non plus de qui détient son ancienne URL (voir src/lib/fichiers.ts).
export async function GET(request: Request) {
  const { error, status } = await requirePermission(14, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id est requis.' }, { status: 400 });

  const rows = await sql`
    select blob_url, mime_type, type from patient_images where id = ${id} limit 1
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Cliché introuvable.' }, { status: 404 });
  }

  return servirFichier(rows[0].blob_url as string, {
    mime: rows[0].mime_type as string | null,
    nomFichier: `${String(rows[0].type || 'cliche').replace(/\s+/g, '-')}.jpg`,
  });
}
