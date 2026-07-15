import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: Request) {
  const { error, status } = await requirePermission(17, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  if (!patientId) {
    return NextResponse.json({ error: 'patientId est requis.' }, { status: 400 });
  }

  const prescriptions = await sql`
    select pr.*, u.full_name as practitioner_name
    from prescriptions pr
    left join users u on u.id = pr.practitioner_id
    where pr.patient_id = ${patientId}
    order by pr.created_at desc
    limit 20
  `;

  return NextResponse.json({ prescriptions });
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(17, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId, medications } = body as {
    patientId?: string;
    medications?: { name: string; dosage?: string; duration?: string; posology?: string }[];
  };

  if (!patientId || !medications?.length) {
    return NextResponse.json({ error: 'patientId et au moins un médicament sont requis.' }, { status: 400 });
  }

  const rows = await sql`
    insert into prescriptions (patient_id, practitioner_id, medications)
    values (${patientId}, ${session!.userId}, ${JSON.stringify(medications)})
    returning *
  `;

  return NextResponse.json({ prescription: rows[0] });
}
