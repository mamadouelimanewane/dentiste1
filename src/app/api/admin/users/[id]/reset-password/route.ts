import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { hashPassword, generateTempPassword } from '@/lib/auth';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// Réinitialisation du mot de passe d'un collaborateur par un administrateur.
//
// Rien ne permettait de le faire. Un membre du personnel qui oubliait son mot
// de passe perdait définitivement l'accès : il n'existait ni changement, ni
// réinitialisation, ni récupération. Le seul recours était une intervention
// directe en base de données — hors de portée d'un cabinet.
//
// Le nouveau mot de passe n'est renvoyé qu'une fois, à l'administrateur qui
// le demande, pour qu'il le remette en main propre. Il n'est jamais stocké en
// clair ni envoyé par un canal quelconque.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { session, error, status } = await requirePermission(10, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const cibles = await sql`select id, full_name, email from users where id = ${params.id} limit 1`;
  if (cibles.length === 0) {
    return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
  }

  const motDePasseTemporaire = generateTempPassword();
  await sql`
    update users set password_hash = ${await hashPassword(motDePasseTemporaire)}, updated_at = now()
    where id = ${params.id}
  `;

  // Les tentatives ratées sont effacées : sans cela, un compte verrouillé pour
  // cause d'oubli resterait bloqué juste après sa réinitialisation, ce qui est
  // précisément le moment où l'on veut se reconnecter.
  await sql`delete from login_attempts where email = ${cibles[0].email}`;

  await recordAudit({
    actorId: session!.userId,
    action: 'Réinitialisation du mot de passe d\'un collaborateur',
    entityTable: 'users',
    entityId: params.id,
    meta: { cible: cibles[0].full_name },
  });

  return NextResponse.json({
    utilisateur: { id: cibles[0].id, nom: cibles[0].full_name },
    motDePasseTemporaire,
  });
}
