import 'server-only';
import { cookies } from 'next/headers';
import { STAFF_COOKIE_NAME, verifyStaffSessionToken } from '@/lib/auth';

export async function getStaffSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyStaffSessionToken(token);
}

// Le contrôle d'accès par nom de rôle en dur (requireRole) a été remplacé
// par des privilèges granulaires par module — voir src/lib/permissions.ts
// (requirePermission, requireManageRoles, requireStaff).
