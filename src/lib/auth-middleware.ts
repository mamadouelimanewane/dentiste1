import { NextResponse, type NextRequest } from 'next/server';
import { STAFF_COOKIE_NAME, verifyStaffSessionToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/', '/login', '/mentions-legales', '/confidentialite', '/portail'];
const PUBLIC_PREFIXES = [
  '/api/whatsapp/webhook',
  // Notifications des fournisseurs de paiement : appelées sans session.
  // Wave est authentifié par sa signature HMAC, Orange Money par le
  // notif_token remis à la création — voir les routes correspondantes.
  '/api/payments/wave/webhook',
  '/api/payments/orange/notify',
  // Callback de statut Twilio : appelé par Twilio sans session, protégé par
  // vérification de la signature X-Twilio-Signature côté route.
  '/api/twilio/status',
  // Accusés de réception Africa's Talking : appelés sans session. Africa's
  // Talking ne signe pas ses rappels ; la route exige un jeton placé dans
  // l'URL déclarée à leur tableau de bord et refuse tout le reste.
  '/api/africastalking/status',
  // Prise de RDV en ligne par un patient anonyme (page /portail). Écriture
  // limitée par IP côté route, pas de lecture de données exposée ici.
  '/api/public/',
  '/api/clinic-settings/public',
  // Tâches planifiées Vercel Cron : appelées sans session de staff, donc
  // jusqu'ici redirigées vers /login — les rappels de rendez-vous et les
  // suivis post-opératoires n'ont jamais pu s'exécuter. Chaque route vérifie
  // elle-même l'en-tête Authorization: Bearer CRON_SECRET (et refuse tout
  // en production si ce secret est absent).
  '/api/cron/',
];

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Le portail patient a son propre mécanisme d'auth (lien magique + cookie
  // JWT signé, voir src/lib/portal-session.ts) — les patients n'ont pas de
  // compte staff. Vérifié par src/app/portal/layout.tsx, pas ici.
  if (path.startsWith('/portal') || path.startsWith('/api/portal')) {
    return NextResponse.next();
  }

  const isPublic =
    PUBLIC_PATHS.includes(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  if (!process.env.SESSION_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      // En production, un secret manquant ne doit jamais désactiver
      // silencieusement la protection des routes : on bloque au lieu de
      // laisser passer. Le mode permissif ci-dessous ne vaut que pour le
      // dev/preview local, avant que les env vars soient posées.
      if (isPublic) return NextResponse.next();
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(STAFF_COOKIE_NAME)?.value;
  const session = token ? await verifyStaffSessionToken(token) : null;

  if (!session && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  if (session && (path === '/' || path === '/login')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard/apps';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}
