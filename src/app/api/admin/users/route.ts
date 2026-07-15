import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { hashPassword, generateTempPassword } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';

export async function GET() {
  const { error, status } = await requirePermission(10, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const users = await sql`
    select u.id, u.full_name, u.email, u.is_active, u.created_at, r.id as role_id, r.slug as role, r.label as role_label
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
