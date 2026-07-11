import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireManageRoles } from '@/lib/permissions';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error, status } = await requireManageRoles();
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { label, isPractitioner, manageRoles, permissions } = body as {
    label?: string;
    isPractitioner?: boolean;
    manageRoles?: boolean;
    permissions?: Record<string, { view?: boolean; manage?: boolean }>;
  };

  if (manageRoles === false) {
    const others = await sql`
      select count(*)::int as count from roles where manage_roles = true and id != ${params.id}
    `;
    if ((others[0] as any).count === 0) {
      return NextResponse.json(
        { error: 'Impossible de retirer ce privilège : au moins un rôle doit pouvoir gérer les rôles.' },
        { status: 400 }
      );
    }
  }

  const rows = await sql`
    update roles set
      label = coalesce(${label ?? null}, label),
      is_practitioner = coalesce(${isPractitioner ?? null}, is_practitioner),
      manage_roles = coalesce(${manageRoles ?? null}, manage_roles),
      permissions = coalesce(${permissions ? JSON.stringify(permissions) : null}, permissions),
      updated_at = now()
    where id = ${params.id}
    returning *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Rôle introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ role: rows[0] });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { error, status } = await requireManageRoles();
  if (error) return NextResponse.json({ error }, { status });

  const target = await sql`select * from roles where id = ${params.id}`;
  if (target.length === 0) {
    return NextResponse.json({ error: 'Rôle introuvable.' }, { status: 404 });
  }

  const assigned = await sql`select count(*)::int as count from users where role_id = ${params.id}`;
  if ((assigned[0] as any).count > 0) {
    return NextResponse.json(
      { error: 'Ce rôle est assigné à des utilisateurs. Réassignez-les avant de le supprimer.' },
      { status: 400 }
    );
  }

  if ((target[0] as any).manage_roles) {
    const others = await sql`
      select count(*)::int as count from roles where manage_roles = true and id != ${params.id}
    `;
    if ((others[0] as any).count === 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer le dernier rôle capable de gérer les rôles.' },
        { status: 400 }
      );
    }
  }

  await sql`delete from roles where id = ${params.id}`;
  return NextResponse.json({ success: true });
}
