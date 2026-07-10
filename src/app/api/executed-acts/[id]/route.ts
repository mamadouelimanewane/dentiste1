import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireRole } from '@/lib/session';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { error, status } = await requireRole(['admin', 'praticien']);
  if (error) return NextResponse.json({ error }, { status });

  await sql`delete from executed_acts where id = ${params.id} and invoice_id is null`;

  return NextResponse.json({ success: true });
}
