import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireRole } from '@/lib/session';

export async function GET() {
  const { error, status } = await requireRole(['admin', 'praticien', 'accueil', 'comptable']);
  if (error) return NextResponse.json({ error }, { status });

  const practitioners = await sql`
    select id, full_name from users where role = 'praticien' and is_active = true order by full_name
  `;

  return NextResponse.json({ practitioners });
}
