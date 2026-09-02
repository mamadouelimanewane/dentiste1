import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// Historique de connexion et journal des actions d'un utilisateur.
//
// L'application enregistrait déjà les tentatives de connexion (pour limiter
// les attaques par force brute) et les actions d'administration, mais rien
// ne permettait de les consulter compte par compte. Dans un cabinet où
// plusieurs personnes partagent les mêmes postes, savoir qui s'est connecté,
// quand et depuis quelle machine fait partie du suivi ordinaire.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { error, status } = await requirePermission(10, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const users = await sql`
    select u.id, u.full_name, u.email, u.is_active, u.created_at, r.label as role_label
    from users u
    left join roles r on r.id = u.role_id
    where u.id = ${params.id}
    limit 1
  `;
  if (users.length === 0) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  const [connexions, actions, stats] = await Promise.all([
    sql`
      select id, ip, success, user_agent, created_at
      from login_attempts
      where user_id = ${params.id}
      order by created_at desc
      limit 100
    `,
    sql`
      select id, action, entity_table, entity_id, meta, created_at
      from audit_logs
      where actor_id = ${params.id}
      order by created_at desc
      limit 100
    `,
    sql`
      select
        count(*) filter (where success)::int as reussies,
        count(*) filter (where not success)::int as echouees,
        max(created_at) filter (where success) as derniere_reussie,
        max(created_at) filter (where not success) as derniere_echouee,
        count(distinct ip) filter (where success)::int as adresses_distinctes
      from login_attempts
      where user_id = ${params.id}
    `,
  ]);

  return NextResponse.json({
    utilisateur: users[0],
    // L'historique est purgé par le cron de nettoyage : on le dit plutôt que
    // de laisser croire à un journal exhaustif depuis la création du compte.
    retentionJours: 365,
    stats: stats[0],
    connexions,
    actions,
  });
}
