import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

type Period = 'week' | 'month' | 'year';

function getPeriodStart(period: Period) {
  const now = new Date();
  if (period === 'week') {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - diffToMonday);
    return { start, now };
  }
  if (period === 'year') {
    return { start: new Date(now.getFullYear(), 0, 1), now };
  }
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), now };
}

// Performance par praticien : nombre d'actes réalisés et revenu généré sur
// la période, calculés depuis executed_acts.performed_by (table réelle),
// pas de "efficacité"/"volume horaire" fabriqués faute de données de source
// (pas de suivi du temps passé par acte dans le schéma actuel).
export async function GET(request: Request) {
  const { error, status } = await requirePermission(22, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get('period');
  const period: Period = periodParam === 'week' || periodParam === 'year' ? periodParam : 'month';
  const { start, now } = getPeriodStart(period);

  const rows = await sql`
    select
      u.id,
      u.full_name,
      count(ea.id)::int as acts_count,
      coalesce(sum(ea.price), 0)::numeric as revenue
    from users u
    join roles r on r.id = u.role_id and r.is_practitioner = true
    left join executed_acts ea on ea.performed_by = u.id and ea.performed_at >= ${start} and ea.performed_at <= ${now}
    where u.is_active = true
    group by u.id, u.full_name
    order by revenue desc
  `;

  return NextResponse.json({
    period,
    practitioners: rows.map((r: any) => ({
      id: r.id,
      name: r.full_name,
      actsCount: r.acts_count,
      revenue: Number(r.revenue),
    })),
  });
}
