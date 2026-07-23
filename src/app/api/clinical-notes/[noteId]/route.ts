import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export async function PATCH(request: Request, { params }: { params: { noteId: string } }) {
  const { session, error, status } = await requirePermission(5, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { content } = body as { content?: string };

  if (!content) {
    return NextResponse.json({ error: 'content est requis' }, { status: 400 });
  }

  const rows = await sql`
    update clinical_notes
    set content = ${content}, updated_at = now()
    where id = ${params.noteId}
    returning id, content, type, created_at, updated_at
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Note introuvable' }, { status: 404 });
  }

  return NextResponse.json({ note: rows[0] });
}

export async function DELETE(request: Request, { params }: { params: { noteId: string } }) {
  const { session, error, status } = await requirePermission(5, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const rows = await sql`
    delete from clinical_notes
    where id = ${params.noteId}
    returning id
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Note introuvable' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
