import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireRole } from '@/lib/session';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { error, status } = await requireRole(['admin', 'praticien', 'accueil', 'comptable']);
  if (error) return NextResponse.json({ error }, { status });

  const rows = await sql`
    select id, dossier_number, full_name, birth_date, phone, address, status, created_at
    from patients
    where id = ${params.id}
    limit 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Patient introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ patient: rows[0] });
}
