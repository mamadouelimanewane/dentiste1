import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: Request) {
  const { error, status } = await requirePermission(6, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');

  if (!patientId) {
    return NextResponse.json({ error: 'patientId est requis.' }, { status: 400 });
  }

  const invoices = await sql`
    select * from invoices where patient_id = ${patientId} order by created_at desc
  `;

  return NextResponse.json({ invoices });
}

// Crée une facture à partir des actes non encore facturés d'un patient.
export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(6, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId } = body as { patientId?: string };

  if (!patientId) {
    return NextResponse.json({ error: 'patientId est requis.' }, { status: 400 });
  }

  const unbilled = await sql`
    select id, price from executed_acts where patient_id = ${patientId} and invoice_id is null
  `;

  if (unbilled.length === 0) {
    return NextResponse.json({ error: 'Aucun acte non facturé pour ce patient.' }, { status: 400 });
  }

  const total = unbilled.reduce((sum, act) => sum + Number(act.price), 0);

  const rows = await sql`
    insert into invoices (patient_id, total, status, created_by)
    values (${patientId}, ${total}, 'pending', ${session!.userId})
    returning *
  `;
  const invoice = rows[0];

  await sql`
    update executed_acts set invoice_id = ${invoice.id}
    where patient_id = ${patientId} and invoice_id is null
  `;

  return NextResponse.json({ invoice });
}
