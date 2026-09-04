import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: Request) {
  const { error, status } = await requirePermission(22, 'view');
  if (error) return NextResponse.json({ error }, { status });

  // Un journal d'audit coupé à 50 lignes sans le dire ne sert à rien : dans un
  // cabinet actif, les 50 dernières entrées couvrent une journée. Qui cherche
  // « qui a modifié ce dossier la semaine dernière » concluait à tort qu'il
  // n'y avait aucune trace. La page se parcourt désormais, et le total est
  // renvoyé pour que l'écran dise ce qu'il ne montre pas.
  const { searchParams } = new URL(request.url);
  const parPage = Math.min(200, Math.max(20, Number(searchParams.get('limit')) || 100));
  const decalage = Math.max(0, Number(searchParams.get('offset')) || 0);

  const rows = await sql`
    select al.id, al.action, al.entity_table, al.entity_id, al.meta, al.created_at, u.full_name as actor_name
    from audit_logs al
    left join users u on u.id = al.actor_id
    order by al.created_at desc
    limit ${parPage} offset ${decalage}
  `;

  const compte = await sql`select count(*)::int as n from audit_logs`;
  const total = Number(compte[0]?.n ?? rows.length);

  return NextResponse.json({
    logs: rows,
    total,
    offset: decalage,
    tronque: total > decalage + rows.length,
  });
}
