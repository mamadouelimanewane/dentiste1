import { NextResponse, type NextRequest } from 'next/server';
import { STAFF_COOKIE_NAME, verifyStaffSessionToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/', '/login'];
const PUBLIC_PREFIXES = ['/api/whatsapp/webhook', '/api/payments/webhook'];

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Le portail patient a son propre mécanisme d'auth (lien magique + cookie
  // JWT signé, voir src/lib/portal-session.ts) — les patients n'ont pas de
  // compte staff. Vérifié par src/app/portal/layout.tsx, pas ici.
  if (path.startsWith('/portal') || path.startsWith('/api/portal')) {
    return NextResponse.next();
  }

  if (!process.env.SESSION_SECRET) {
    // Pas de secret configuré : on laisse passer sans forcer /login pour ne
    // pas bloquer le dev/preview local avant que les env vars soient posées.
    return NextResponse.next();
  }

  const token = request.cookies.get(STAFF_COOKIE_NAME)?.value;
  const session = token ? await verifyStaffSessionToken(token) : null;

  const isPublic =
    PUBLIC_PATHS.includes(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  if (!session && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  if (session && path === '/login') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}
