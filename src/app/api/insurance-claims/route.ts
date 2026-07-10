import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireRole } from '@/lib/session';

export async function GET() {
  const { error, status } = await requireRole(['admin', 'praticien', 'accueil', 'comptable']);
  if (error) return NextResponse.json({ error }, { status });

  const claims = await sql`
    select ic.*, p.full_name as patient_name
    from insurance_claims ic
    join patients p on p.id = ic.patient_id
    order by ic.created_at desc
    limit 100
  `;

  return NextResponse.json({ claims });
}

export async function POST(request: Request) {
  const { session, error, status } = await requireRole(['admin', 'praticien', 'accueil', 'comptable']);
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId, provider, policyNumber, claimType, amount, invoiceId } = body as {
    patientId?: string;
    provider?: string;
    policyNumber?: string;
    claimType?: string;
    amount?: number;
    invoiceId?: string;
  };

  if (!patientId || !provider || !amount) {
    return NextResponse.json({ error: 'patientId, provider et amount sont requis.' }, { status: 400 });
  }

  const rows = await sql`
    insert into insurance_claims (patient_id, invoice_id, provider, policy_number, claim_type, amount, created_by)
    values (${patientId}, ${invoiceId || null}, ${provider}, ${policyNumber || null}, ${claimType || null}, ${amount}, ${session!.userId})
    returning *
  `;

  return NextResponse.json({ claim: rows[0] });
}
