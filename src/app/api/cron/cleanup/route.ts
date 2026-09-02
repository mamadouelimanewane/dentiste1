import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET;

// Purge des tentatives de connexion. Le rate-limiting ne regarde que les 15
// dernières minutes (voir src/app/login/actions.ts), mais l'historique par
// utilisateur, lui, doit tenir dans la durée : savoir quand un compte s'est
// connecté et depuis où fait partie du suivi d'un cabinet. On sépare donc
// les deux usages — les échecs, utiles surtout à court terme pour repérer
// une attaque, et les connexions réussies, qui constituent le journal.
const ECHECS_RETENTION_DAYS = 30;
const CONNEXIONS_RETENTION_DAYS = 365;

export async function GET(request: Request) {
  // La route est publique au sens du middleware (Vercel Cron n'a pas de
  // session) : c'est donc ici, et nulle part ailleurs, qu'elle est protégée.
  // En production un secret absent doit fermer la porte, jamais l'ouvrir.
  if (!CRON_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'CRON_SECRET non configuré.' }, { status: 401 });
    }
  } else {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }
  }

  const echecs = await sql`
    delete from login_attempts
    where success = false
      and created_at < now() - make_interval(days => ${ECHECS_RETENTION_DAYS})
    returning id
  `;

  const connexions = await sql`
    delete from login_attempts
    where success = true
      and created_at < now() - make_interval(days => ${CONNEXIONS_RETENTION_DAYS})
    returning id
  `;

  return NextResponse.json({
    deletedLoginAttempts: echecs.length + connexions.length,
    echecsPurges: echecs.length,
    connexionsPurgees: connexions.length,
  });
}
