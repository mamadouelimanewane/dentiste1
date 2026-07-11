import 'server-only';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

export const STAFF_COOKIE_NAME = 'dentiste_staff_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 jours

// Les rôles sont désormais dynamiques (table `roles`, créables/modifiables
// depuis l'admin) — plus un enum fixe. `role` reste le slug pour l'affichage
// (badge, dropdown) ; toute décision d'autorisation doit passer par
// `roleId` + src/lib/permissions.ts, jamais par une comparaison de nom.
export type Role = string;

export interface StaffSessionPayload {
  userId: string;
  roleId: string;
  role: string;
  roleLabel: string;
  fullName: string;
}

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET est requis pour l\'authentification.');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createStaffSessionToken(payload: StaffSessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyStaffSessionToken(token: string): Promise<StaffSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== 'string' || typeof payload.roleId !== 'string') return null;
    return {
      userId: payload.userId,
      roleId: payload.roleId,
      role: (payload.role as string) || '',
      roleLabel: (payload.roleLabel as string) || '',
      fullName: (payload.fullName as string) || '',
    };
  } catch {
    return null;
  }
}

export const STAFF_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_DURATION_SECONDS,
};

export function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
