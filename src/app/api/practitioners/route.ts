import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireStaff } from '@/lib/permissions';

export async function GET() {
  const { error, status } = await requireStaff();
  if (error) return NextResponse.json({ error }, { status });

  const practitioners = await sql`
    select u.id, u.full_name
    from users u
    join roles r on r.id = u.role_id
    where r.is_practitioner = true and u.is_active = true
    order by u.full_name
  `;

  return NextResponse.json({ practitioners });
}
