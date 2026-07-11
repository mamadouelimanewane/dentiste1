import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: Request) {
  const { error, status } = await requirePermission(5, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const unbilledOnly = searchParams.get('unbilled') === 'true';

  if (!patientId) {
    return NextResponse.json({ error: 'patientId est requis.' }, { status: 400 });
  }

  const acts = unbilledOnly
    ? await sql`
        select * from executed_acts
        where patient_id = ${patientId} and invoice_id is null
        order by performed_at asc
      `
    : await sql`
        select * from executed_acts
        where patient_id = ${patientId}
        order by performed_at asc
      `;

  return NextResponse.json({ acts });
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(5, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId, code, label, tooth, price } = body as {
    patientId?: string;
    code?: string;
    label?: string;
    tooth?: number;
    price?: number;
  };

  if (!patientId || !label) {
    return NextResponse.json({ error: 'patientId et label sont requis.' }, { status: 400 });
  }

  const rows = await sql`
    insert into executed_acts (patient_id, code, label, tooth, price, performed_by)
    values (${patientId}, ${code || null}, ${label}, ${tooth || null}, ${price || 0}, ${session!.userId})
    returning *
  `;

  return NextResponse.json({ act: rows[0] });
}
