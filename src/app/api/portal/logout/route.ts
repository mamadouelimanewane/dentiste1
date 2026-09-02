import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PORTAL_COOKIE_NAME } from '@/lib/portal-session';

export const dynamic = 'force-dynamic';

// Déconnexion du portail patient. Le portail n'offrait aucun moyen de se
// déconnecter : un patient ouvrant son lien sur un téléphone partagé ou
// familial laissait sa session ouverte, avec ses ordonnances, documents et
// messages accessibles au suivant.
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
