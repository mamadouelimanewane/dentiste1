import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireRole } from '@/lib/session';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { error, status } = await requireRole(['admin', 'praticien', 'accueil', 'comptable']);
  if (error) return NextResponse.json({ error }, { status });

  const rows = await sql`select * from invoices where id = ${params.id} limit 1`;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ invoice: rows[0] });
}
