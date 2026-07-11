import { SignJWT, jwtVerify } from 'jose';

export const PORTAL_COOKIE_NAME = 'dentiste_portal_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 jours

function getSecretKey() {
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret) {
    throw new Error('PORTAL_SESSION_SECRET est requis pour le portail patient.');
  }
  return new TextEncoder().encode(secret);
}

export async function createPortalSessionToken(patientId: string) {
  return new SignJWT({ patientId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyPortalSessionToken(token: string): Promise<{ patientId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.patientId !== 'string') return null;
    return { patientId: payload.patientId };
  } catch {
    return null;
  }
}

export const PORTAL_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_DURATION_SECONDS,
};
