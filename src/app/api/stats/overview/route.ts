import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

type Period = 'week' | 'month' | 'year';

function getPeriodBounds(period: Period) {
  const now = new Date();
  let start: Date;
  let prevStart: Date;

  if (period === 'week') {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - diffToMonday);
    prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 7);
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
    prevStart = new Date(now.getFullYear() - 1, 0, 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }

  return { now, start, prevStart, prevEnd: start };
}

function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export async function GET(request: Request) {
  const { error, status } = await requirePermission(23, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get('period');
  const period: Period = periodParam === 'week' || periodParam === 'year' ? periodParam : 'month';

  const { now, start, prevStart, prevEnd } = getPeriodBounds(period);

  const [
    caRows,
    prevCaRows,
    encaissementsRows,
    prevEncaissementsRows,
    patientsRows,
    prevPatientsRows,
    appointmentsRows,
    prevAppointmentsRows,
    topActsRows,
    monthlyRows,
    panierRows,
    totalActsRows,
  ] = await Promise.all([
    sql`select coalesce(sum(total), 0)::numeric as total from invoices where status in ('paid','pending') and created_at >= ${start} and created_at <= ${now}`,
    sql`select coalesce(sum(total), 0)::numeric as total from invoices where status in ('paid','pending') and created_at >= ${prevStart} and created_at < ${prevEnd}`,
    sql`select coalesce(sum(total), 0)::numeric as total from invoices where status = 'paid' and paid_at >= ${start} and paid_at <= ${now}`,
    sql`select coalesce(sum(total), 0)::numeric as total from invoices where status = 'paid' and paid_at >= ${prevStart} and paid_at < ${prevEnd}`,
    sql`select count(*)::int as count from patients where created_at >= ${start} and created_at <= ${now}`,
    sql`select count(*)::int as count from patients where created_at >= ${prevStart} and created_at < ${prevEnd}`,
    sql`select status, count(*)::int as count from appointments where scheduled_at >= ${start} and scheduled_at <= ${now} group by status`,
    sql`select status, count(*)::int as count from appointments where scheduled_at >= ${prevStart} and scheduled_at < ${prevEnd} group by status`,
    sql`
      select label, count(*)::int as count, coalesce(sum(price), 0)::numeric as revenue
      from executed_acts
      where performed_at >= ${start} and performed_at <= ${now}
      group by label
      order by count desc
      limit 4
    `,
    sql`
      select date_trunc('month', paid_at) as month, coalesce(sum(total), 0)::numeric as total
      from invoices
      where status = 'paid' and paid_at >= ${new Date(now.getFullYear(), now.getMonth() - 11, 1)}
      group by 1
      order by 1
    `,
    sql`select coalesce(avg(total), 0)::numeric as avg from invoices where status = 'paid' and paid_at >= ${start} and paid_at <= ${now}`,
    sql`select count(*)::int as count from executed_acts where performed_at >= ${start} and performed_at <= ${now}`,
  ]);

  const ca = Number(caRows[0].total);
  const prevCa = Number(prevCaRows[0].total);
  const encaissements = Number(encaissementsRows[0].total);
  const prevEncaissements = Number(prevEncaissementsRows[0].total);
  const newPatients = Number(patientsRows[0].count);
  const prevNewPatients = Number(prevPatientsRows[0].count);
  const panierMoyen = Number(panierRows[0].avg);

  function realisationRate(rows: { status: string; count: number }[]) {
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    const completed = rows.find((r) => r.status === 'completed')?.count || 0;
    return total > 0 ? (completed / total) * 100 : null;
  }
  const realisation = realisationRate(appointmentsRows as any);
  const prevRealisation = realisationRate(prevAppointmentsRows as any);

  const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const monthlyMap = new Map<string, number>();
  for (const row of monthlyRows as any[]) {
    const d = new Date(row.month);
    monthlyMap.set(`${d.getFullYear()}-${d.getMonth()}`, Number(row.total));
  }
  const evolutionCa = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      label: monthLabels[d.getMonth()],
      total: monthlyMap.get(`${d.getFullYear()}-${d.getMonth()}`) || 0,
    };
  });
  const maxMonthly = Math.max(1, ...evolutionCa.map((m) => m.total));

  return NextResponse.json({
    period,
    kpis: {
      chiffreAffaires: { value: ca, trend: pctChange(ca, prevCa) },
      nouveauxPatients: { value: newPatients, trend: pctChange(newPatients, prevNewPatients) },
      tauxRealisationRdv: { value: realisation, trend: pctChange(realisation ?? 0, prevRealisation ?? 0) },
      encaissements: { value: encaissements, trend: pctChange(encaissements, prevEncaissements) },
      panierMoyen: { value: panierMoyen },
      actesRealises: { value: Number(totalActsRows[0].count) },
    },
    topActs: (topActsRows as any[]).map((r) => ({
      name: r.label,
      count: r.count,
      revenue: Number(r.revenue),
    })),
    evolutionCa: evolutionCa.map((m) => ({ label: m.label, total: m.total, heightPct: Math.round((m.total / maxMonthly) * 100) })),
  });
}
