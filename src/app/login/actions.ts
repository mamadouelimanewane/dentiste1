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
    select id, full_name, password_hash, role, is_active
    from users
    where email = ${email}
    limit 1
  `;
  const user = rows[0] as
    | { id: string; full_name: string; password_hash: string; role: string; is_active: boolean }
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
    role: user.role as any,
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
