import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission, requireManageRoles } from '@/lib/permissions';

export async function GET() {
  const { error, status } = await requirePermission(10, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const roles = await sql`select * from roles order by is_system desc, label`;
  return NextResponse.json({ roles });
}

export async function POST(request: Request) {
  const { error, status } = await requireManageRoles();
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { slug, label, isPractitioner, manageRoles, permissions } = body as {
    slug?: string;
    label?: string;
    isPractitioner?: boolean;
    manageRoles?: boolean;
    permissions?: Record<string, { view?: boolean; manage?: boolean }>;
  };

  if (!slug || !label) {
    return NextResponse.json({ error: 'slug et label sont requis.' }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Le slug ne peut contenir que des minuscules, chiffres et tirets.' }, { status: 400 });
  }

  try {
    const rows = await sql`
      insert into roles (slug, label, is_practitioner, manage_roles, permissions)
      values (${slug}, ${label}, ${!!isPractitioner}, ${!!manageRoles}, ${JSON.stringify(permissions || {})})
      returning *
    `;
    return NextResponse.json({ role: rows[0] });
  } catch (e: any) {
    if (e?.code === '23505') {
      return NextResponse.json({ error: 'Ce slug est déjà utilisé.' }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || 'Erreur inconnue.' }, { status: 500 });
  }
}
