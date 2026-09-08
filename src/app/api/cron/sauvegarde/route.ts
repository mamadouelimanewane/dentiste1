import { NextResponse } from 'next/server';
import { executerSauvegarde } from '@/lib/integrations/sauvegarde';

export const dynamic = 'force-dynamic';
// Le dump complet peut dépasser les 10 s par défaut sur une base chargée.
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;

// Sauvegarde quotidienne de la base (voir src/lib/integrations/sauvegarde.ts).
//
// La route est publique au sens du middleware (Vercel Cron n'a pas de
// session) : c'est donc ici, et nulle part ailleurs, qu'elle est protégée.
// En production un secret absent doit fermer la porte, jamais l'ouvrir — a
// fortiori sur une route qui lit l'intégralité des dossiers patients.
export async function GET(request: Request) {
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

  try {
    const r = await executerSauvegarde();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    // Une sauvegarde qui échoue en silence est pire que pas de sauvegarde du
    // tout : on croit être couvert. Le message part dans le journal de la
    // tâche, et l'écran d'administration montre la date du dernier fichier
    // réellement déposé — jamais une promesse.
    const message = e instanceof Error ? e.message : 'Erreur inconnue.';
    console.error('[cron/sauvegarde] échec :', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
