import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: Request) {
  const { error, status } = await requirePermission(5, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');

  if (!patientId) {
    return NextResponse.json({ error: 'patientId est requis' }, { status: 400 });
  }

  const notes = await sql`
    select id, content, type, created_at, updated_at, created_by
    from clinical_notes
    where patient_id = ${patientId}
    order by created_at desc
  `;

  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(5, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId, content, type } = body as {
    patientId?: string;
    content?: string;
    type?: string;
  };

  if (!patientId || !content) {
    return NextResponse.json({ error: 'patientId et content sont requis' }, { status: 400 });
  }

  const rows = await sql`
    insert into clinical_notes (patient_id, content, type, created_by)
    values (${patientId}, ${content}, ${type || 'general'}, ${session!.userId})
    returning id, content, type, created_at, updated_at
  `;

  return NextResponse.json({ note: rows[0] });
}
