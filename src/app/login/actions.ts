'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { verifyPassword, createStaffSessionToken, STAFF_COOKIE_NAME, STAFF_COOKIE_OPTIONS } from '@/lib/auth';

export async function signIn(_prevState: { error: string | null }, formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'Email et mot de passe requis.' };
  }

  const rows = await sql`
    select u.id, u.full_name, u.password_hash, u.is_active, r.id as role_id, r.slug as role_slug, r.label as role_label
    from users u
    join roles r on r.id = u.role_id
    where u.email = ${email}
    limit 1
  `;
  const user = rows[0] as
    | { id: string; full_name: string; password_hash: string; is_active: boolean; role_id: string; role_slug: string; role_label: string }
    | undefined;

  if (!user || !user.is_active) {
    return { error: 'Identifiants incorrects.' };
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: 'Identifiants incorrects.' };
  }

  const token = await createStaffSessionToken({
    userId: user.id,
    roleId: user.role_id,
    role: user.role_slug,
    roleLabel: user.role_label,
    fullName: user.full_name,
  });

  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE_NAME, token, STAFF_COOKIE_OPTIONS);

  redirect('/dashboard');
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_COOKIE_NAME);
  redirect('/login');
}
