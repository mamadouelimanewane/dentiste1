import 'server-only';
import { cookies } from 'next/headers';
import { STAFF_COOKIE_NAME, verifyStaffSessionToken, type Role } from '@/lib/auth';

export async function getStaffSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyStaffSessionToken(token);
}

// Vérifie la session et le rôle depuis une route API. Retourne la session si
// autorisée, sinon une NextResponse d'erreur à renvoyer directement.
export async function requireRole(allowedRoles: Role[]) {
  const session = await getStaffSession();
  if (!session) {
    return { session: null, status: 401 as const, error: 'Non authentifié.' };
  }
  if (!allowedRoles.includes(session.role)) {
    return { session: null, status: 403 as const, error: 'Rôle non autorisé.' };
  }
  return { session, status: 200 as const, error: null };
}
