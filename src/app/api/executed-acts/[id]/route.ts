import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { error, status } = await requirePermission(5, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  await sql`delete from executed_acts where id = ${params.id} and invoice_id is null`;

  return NextResponse.json({ success: true });
}
