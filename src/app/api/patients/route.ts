import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireRole } from '@/lib/session';

export async function GET(request: Request) {
  const { error, status } = await requireRole(['admin', 'praticien', 'accueil', 'comptable']);
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  const patients = q
    ? await sql`
        select id, dossier_number, full_name, phone, status, created_at
        from patients
        where full_name ilike ${'%' + q + '%'}
           or dossier_number ilike ${'%' + q + '%'}
           or phone ilike ${'%' + q + '%'}
        order by created_at desc
        limit 50
      `
    : await sql`
        select id, dossier_number, full_name, phone, status, created_at
        from patients
        order by created_at desc
        limit 50
      `;

  return NextResponse.json({ patients });
}

export async function POST(request: Request) {
  const { session, error, status } = await requireRole(['admin', 'praticien', 'accueil']);
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { fullName, birthDate, phone, address } = body as {
    fullName?: string;
    birthDate?: string;
    phone?: string;
    address?: string;
  };

  if (!fullName) {
    return NextResponse.json({ error: 'fullName est requis.' }, { status: 400 });
  }

  const rows = await sql`
    insert into patients (full_name, birth_date, phone, address, created_by)
    values (${fullName}, ${birthDate || null}, ${phone || null}, ${address || null}, ${session!.userId})
    returning id, dossier_number, full_name, birth_date, phone, address, status, created_at
  `;

  return NextResponse.json({ patient: rows[0] });
}
