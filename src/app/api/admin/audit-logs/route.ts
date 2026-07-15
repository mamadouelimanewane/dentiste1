import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export async function GET() {
  const { error, status } = await requirePermission(22, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const rows = await sql`
    select al.id, al.action, al.entity_table, al.entity_id, al.meta, al.created_at, u.full_name as actor_name
    from audit_logs al
    left join users u on u.id = al.actor_id
    order by al.created_at desc
    limit 50
  `;

  return NextResponse.json({ logs: rows });
}
