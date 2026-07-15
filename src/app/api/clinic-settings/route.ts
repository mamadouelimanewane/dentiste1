import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export async function GET() {
  const { error, status } = await requirePermission(21, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const rows = await sql`select * from clinic_settings where id = true limit 1`;
  return NextResponse.json({ settings: rows[0] || null });
}

export async function PUT(request: Request) {
  const { session, error, status } = await requirePermission(21, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const {
    clinicName, slogan, phone, email, website, address, rpps, ninea, rccm, currency,
  } = body as Record<string, string | undefined>;

  if (!clinicName?.trim()) {
    return NextResponse.json({ error: 'Le nom du cabinet est requis.' }, { status: 400 });
  }

  const rows = await sql`
    update clinic_settings
    set
      clinic_name = ${clinicName.trim()},
      slogan = ${slogan || null},
      phone = ${phone || null},
      email = ${email || null},
      website = ${website || null},
      address = ${address || null},
      rpps = ${rpps || null},
      ninea = ${ninea || null},
      rccm = ${rccm || null},
      currency = ${currency || 'FCFA'},
      updated_by = ${session!.userId},
      updated_at = now()
    where id = true
    returning *
  `;

  return NextResponse.json({ settings: rows[0] });
}
