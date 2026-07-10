import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { hashPassword, generateTempPassword } from '@/lib/auth';

export async function GET() {
  const { error, status } = await requireRole(['admin']);
  if (error) return NextResponse.json({ error }, { status });

  const users = await sql`
    select id, full_name, email, role, is_active, created_at
    from users
    order by created_at desc
  `;

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const { error, status } = await requireRole(['admin']);
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { email, fullName, role } = body as { email?: string; fullName?: string; role?: string };

  if (!email || !fullName || !role) {
    return NextResponse.json({ error: 'email, fullName et role sont requis.' }, { status: 400 });
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  try {
    const rows = await sql`
      insert into users (full_name, email, password_hash, role)
      values (${fullName}, ${email.toLowerCase()}, ${passwordHash}, ${role})
      returning id, full_name, email, role, is_active, created_at
    `;
    return NextResponse.json({ user: rows[0], tempPassword });
  } catch (e: any) {
    if (e?.code === '23505') {
      return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || 'Erreur inconnue.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { error, status } = await requireRole(['admin']);
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { userId, role, isActive } = body as {
    userId?: string;
    role?: string;
    isActive?: boolean;
  };

  if (!userId) {
    return NextResponse.json({ error: 'userId est requis.' }, { status: 400 });
  }
  if (role === undefined && isActive === undefined) {
    return NextResponse.json({ error: 'Aucune modification fournie.' }, { status: 400 });
  }

  const rows = await sql`
    update users
    set
      role = coalesce(${role ?? null}, role),
      is_active = coalesce(${isActive ?? null}, is_active),
      updated_at = now()
    where id = ${userId}
    returning id, full_name, email, role, is_active, created_at
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ user: rows[0] });
}
