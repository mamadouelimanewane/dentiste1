import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET;

// Purge les vieilles tentatives de connexion — seules les 15 dernières
// minutes comptent pour le rate-limiting (voir src/app/login/actions.ts),
// le reste ne sert qu'à un éventuel audit à court terme.
const LOGIN_ATTEMPTS_RETENTION_DAYS = 30;

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

  const deleted = await sql`
    delete from login_attempts
    where created_at < now() - make_interval(days => ${LOGIN_ATTEMPTS_RETENTION_DAYS})
    returning id
  `;

  return NextResponse.json({ deletedLoginAttempts: deleted.length });
}
