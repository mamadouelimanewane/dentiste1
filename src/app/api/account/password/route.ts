import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getStaffSession } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// Changement de son propre mot de passe.
//
// Cette route n'existait pas. L'écran de création d'utilisateur annonçait
// pourtant « un mot de passe temporaire sera généré — il pourra le changer
// ensuite » : c'était faux. Chaque membre du personnel gardait donc
// indéfiniment le mot de passe communiqué de vive voix le premier jour, et
// personne ne pouvait le renouveler après un départ ou une indiscrétion.

const LONGUEUR_MIN = 10;

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const body = await request.json();
  const { motDePasseActuel, nouveauMotDePasse } = body as {
    motDePasseActuel?: string;
    nouveauMotDePasse?: string;
  };

  if (!motDePasseActuel || !nouveauMotDePasse) {
    return NextResponse.json(
      { error: 'Mot de passe actuel et nouveau mot de passe requis.' },
      { status: 400 }
    );
  }
  if (nouveauMotDePasse.length < LONGUEUR_MIN) {
    return NextResponse.json(
      { error: `Le nouveau mot de passe doit faire au moins ${LONGUEUR_MIN} caractères.` },
      { status: 400 }
    );
  }
  if (nouveauMotDePasse === motDePasseActuel) {
    return NextResponse.json(
      { error: 'Le nouveau mot de passe doit être différent de l\'actuel.' },
      { status: 400 }
    );
  }

  const lignes = await sql`select password_hash from users where id = ${session.userId} limit 1`;
  if (lignes.length === 0) {
    return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
  }

  // On exige le mot de passe actuel : sans cela, un poste laissé déverrouillé
  // suffirait à s'approprier le compte de qui l'a laissé ouvert.
  const correct = await verifyPassword(motDePasseActuel, lignes[0].password_hash as string);
  if (!correct) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 403 });
  }

  await sql`
    update users set password_hash = ${await hashPassword(nouveauMotDePasse)}, updated_at = now()
    where id = ${session.userId}
  `;

  // Le mot de passe n'apparaît évidemment nulle part dans la trace.
  await recordAudit({
    actorId: session.userId,
    action: 'Changement de mot de passe',
    entityTable: 'users',
    entityId: session.userId,
  });

  return NextResponse.json({ success: true });
}
