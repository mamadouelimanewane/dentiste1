import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { session, error, status } = await requirePermission(22, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { name, category, body: templateBody } = body as { name?: string; category?: string; body?: string };

  const rows = await sql`
    update document_templates set
      name = coalesce(${name ?? null}, name),
      category = coalesce(${category ?? null}, category),
      body = coalesce(${templateBody ?? null}, body),
      updated_at = now()
    where id = ${params.id}
    returning *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Modèle introuvable.' }, { status: 404 });
  }

  await recordAudit({
    actorId: session!.userId,
    action: 'Modification modèle de document',
    entityTable: 'document_templates',
    entityId: params.id,
    meta: { name: rows[0].name },
  });

  return NextResponse.json({ template: rows[0] });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { session, error, status } = await requirePermission(22, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const target = await sql`select name from document_templates where id = ${params.id}`;
  if (target.length === 0) {
    return NextResponse.json({ error: 'Modèle introuvable.' }, { status: 404 });
  }

  await sql`delete from document_templates where id = ${params.id}`;

  await recordAudit({
    actorId: session!.userId,
    action: 'Suppression modèle de document',
    entityTable: 'document_templates',
    entityId: params.id,
    meta: { name: (target[0] as any).name },
  });

  return NextResponse.json({ success: true });
}
