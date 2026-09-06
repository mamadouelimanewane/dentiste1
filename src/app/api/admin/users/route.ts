import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { hashPassword, generateTempPassword } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';

export async function GET() {
  const { error, status } = await requirePermission(10, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const users = await sql`
    -- La colonne « Dernière connexion » de l'écran d'administration
    -- affichait un tiret écrit en dur : elle promettait une information
    -- qu'elle n'avait jamais, alors que login_attempts la contient. Un
    -- administrateur doit pouvoir voir qui ne s'est jamais connecté, et qui
    -- ne vient plus.
    select u.id, u.full_name, u.email, u.is_active, u.created_at,
           r.id as role_id, r.slug as role, r.label as role_label,
           (
             select max(la.created_at) from login_attempts la
             where la.email = u.email and la.success = true
           ) as derniere_connexion
    from users u
    join roles r on r.id = u.role_id
    order by u.created_at desc
  `;

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(10, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { email, fullName, roleId } = body as { email?: string; fullName?: string; roleId?: string };

  if (!email || !fullName || !roleId) {
    return NextResponse.json({ error: 'email, fullName et roleId sont requis.' }, { status: 400 });
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  try {
    const rows = await sql`
      insert into users (full_name, email, password_hash, role_id)
      values (${fullName}, ${email.toLowerCase()}, ${passwordHash}, ${roleId})
      returning id, full_name, email, role_id, is_active, created_at
    `;

    await recordAudit({
      actorId: session!.userId,
      action: 'Création utilisateur',
      entityTable: 'users',
      entityId: rows[0].id,
      meta: { email: rows[0].email, fullName: rows[0].full_name },
    });

    return NextResponse.json({ user: rows[0], tempPassword });
  } catch (e: any) {
    if (e?.code === '23505') {
      return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 });
    }
    if (e?.code === '23503') {
      return NextResponse.json({ error: 'Rôle introuvable.' }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message || 'Erreur inconnue.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { session, error, status } = await requirePermission(10, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { userId, roleId, isActive } = body as {
    userId?: string;
    roleId?: string;
    isActive?: boolean;
  };

  if (!userId) {
    return NextResponse.json({ error: 'userId est requis.' }, { status: 400 });
  }
  if (roleId === undefined && isActive === undefined) {
    return NextResponse.json({ error: 'Aucune modification fournie.' }, { status: 400 });
  }

  // Un administrateur ne peut pas se désactiver lui-même : il perdrait
  // l'accès immédiatement, sans possibilité de revenir en arrière.
  if (isActive === false && userId === session!.userId) {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas désactiver votre propre compte.' },
      { status: 400 }
    );
  }

  // Les rôles sont déjà protégés contre la suppression du dernier rôle
  // administrateur, mais rien n'empêchait de désactiver tous les comptes qui
  // le portent — ce qui verrouille le cabinet tout aussi sûrement. Comme
  // aucune récupération de mot de passe n'existe, seul un accès direct à la
  // base permettrait alors de rouvrir l'application.
  const perdLAdministration =
    isActive === false || (roleId !== undefined && roleId !== null);

  if (perdLAdministration) {
    const cible = await sql`
      select u.id, r.manage_roles
      from users u join roles r on r.id = u.role_id
      where u.id = ${userId} and u.is_active = true
      limit 1
    `;

    if (cible[0]?.manage_roles) {
      const nouveauRole = roleId
        ? await sql`select manage_roles from roles where id = ${roleId} limit 1`
        : null;
      const resteAdministrateur =
        isActive !== false && !!nouveauRole?.[0]?.manage_roles;

      if (!resteAdministrateur) {
        const autres = await sql`
          select count(*)::int as count
          from users u join roles r on r.id = u.role_id
          where r.manage_roles = true and u.is_active = true and u.id <> ${userId}
        `;
        if (autres[0].count === 0) {
          return NextResponse.json(
            {
              error:
                "Ce compte est le dernier administrateur actif. Nommez d'abord un autre administrateur, sinon plus personne ne pourra administrer le cabinet.",
            },
            { status: 400 }
          );
        }
      }
    }
  }

  try {
    const rows = await sql`
      update users
      set
        role_id = coalesce(${roleId ?? null}, role_id),
        is_active = coalesce(${isActive ?? null}, is_active),
        updated_at = now()
      where id = ${userId}
      returning id, full_name, email, role_id, is_active, created_at
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    await recordAudit({
      actorId: session!.userId,
      action: 'Modification utilisateur',
      entityTable: 'users',
      entityId: rows[0].id,
      meta: { roleId, isActive },
    });

    return NextResponse.json({ user: rows[0] });
  } catch (e: any) {
    if (e?.code === '23503') {
      return NextResponse.json({ error: 'Rôle introuvable.' }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message || 'Erreur inconnue.' }, { status: 500 });
  }
}
