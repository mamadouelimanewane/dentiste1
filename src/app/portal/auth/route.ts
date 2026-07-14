import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { createPortalSessionToken, PORTAL_COOKIE_NAME, PORTAL_COOKIE_OPTIONS } from '@/lib/portal-session';

export const dynamic = 'force-dynamic';

// Consomme un lien magique à usage unique et ouvre une session portail.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${origin}/portal/invalid`);
  }

  const rows = await sql`
    select id, patient_id, expires_at, used_at
    from patient_portal_tokens
    where token = ${token}
    limit 1
  `;
  const row = rows[0];

  if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
    return NextResponse.redirect(`${origin}/portal/invalid`);
  }

  await sql`update patient_portal_tokens set used_at = now() where id = ${row.id}`;

  const sessionToken = await createPortalSessionToken(row.patient_id);
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_COOKIE_NAME, sessionToken, PORTAL_COOKIE_OPTIONS);

  return NextResponse.redirect(`${origin}/portal`);
}
