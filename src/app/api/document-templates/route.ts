import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

export async function GET() {
  const { error, status } = await requirePermission(22, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const templates = await sql`select * from document_templates order by category asc, name asc`;
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(22, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { name, category, body: templateBody } = body as { name?: string; category?: string; body?: string };

  if (!name || !templateBody) {
    return NextResponse.json({ error: 'name et body sont requis.' }, { status: 400 });
  }

  const rows = await sql`
    insert into document_templates (name, category, body, created_by)
    values (${name}, ${category || 'Autre'}, ${templateBody}, ${session!.userId})
    returning *
  `;

  const template = rows[0];

  await recordAudit({
    actorId: session!.userId,
    action: 'Création modèle de document',
    entityTable: 'document_templates',
    entityId: template.id,
    meta: { name: template.name },
  });

  return NextResponse.json({ template });
}
