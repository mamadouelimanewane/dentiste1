import { NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Les sauvegardes sont déposées en accès privé : leur URL ne suffit pas à les
// ouvrir. Ce passage-plat est le seul chemin de lecture, et il exige la même
// permission que l'administration du cabinet.
//
// Un fichier de sauvegarde contient l'intégralité des dossiers patients. Son
// téléchargement est donc journalisé, comme toute consultation de masse.
export async function GET(request: Request) {
  const { session, error, status } = await requirePermission(22, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const chemin = new URL(request.url).searchParams.get('chemin') || '';

  // Le chemin vient du navigateur : on ne laisse pas une valeur choisie par
  // l'appelant désigner n'importe quel fichier du magasin — celui des
  // documents patients, par exemple.
  if (!/^sauvegardes\/[A-Za-z0-9._-]+\.json$/.test(chemin)) {
    return NextResponse.json({ error: 'Sauvegarde inconnue.' }, { status: 400 });
  }

  const fichier = await get(chemin, { access: 'private' });
  if (!fichier) {
    return NextResponse.json({ error: 'Sauvegarde introuvable.' }, { status: 404 });
  }

  await recordAudit({
    actorId: session!.userId,
    action: 'sauvegarde_telechargee',
    entityTable: 'sauvegardes',
    meta: { chemin },
  });

  const nom = chemin.slice('sauvegardes/'.length);
  return new NextResponse(fichier.stream, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${nom}"`,
      'Cache-Control': 'no-store',
    },
  });
}
