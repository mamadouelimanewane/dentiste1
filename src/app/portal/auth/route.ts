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

  // update ... returning atomique : marque le token utilisé et ne renvoie
  // une ligne que s'il était encore valide, ce qui élimine la fenêtre de
  // course où deux requêtes concurrentes avec le même token passeraient
  // toutes les deux le check avant l'update.
  const rows = await sql`
    update patient_portal_tokens
    set used_at = now()
    where token = ${token} and used_at is null and expires_at >= now()
    returning id, patient_id
  `;
  const row = rows[0];

  if (!row) {
    return NextResponse.redirect(`${origin}/portal/invalid`);
  }

  const sessionToken = await createPortalSessionToken(row.patient_id);
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_COOKIE_NAME, sessionToken, PORTAL_COOKIE_OPTIONS);

  return NextResponse.redirect(`${origin}/portal`);
}
