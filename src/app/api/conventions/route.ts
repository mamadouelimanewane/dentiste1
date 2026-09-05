import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission, getRoleById } from '@/lib/permissions';
import { getStaffSession } from '@/lib/session';
import { hasPermission } from '@/lib/modules';
import { bornerTexte } from '@/lib/validation';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// Bases tarifaires par convention.
//
// Chaque prix du catalogue est une cotation multipliée par la valeur de la
// lettre-clé D. Cette valeur dépend de l'organisme : le cabinet applique la
// sienne à un patient sans mutuelle, une autre à un patient couvert par une
// IPM. Elle était figée à 1 200 F dans le code — donc fausse pour toute
// convention retenant un autre montant, et fausse silencieusement : les
// devis restaient cohérents entre eux, seulement décalés.

// Une lettre-clé hors de ces bornes relève de la faute de frappe, pas du
// tarif : à 10 F le devis est absurde, à 100 000 F il est ruineux.
const D_MIN = 100;
const D_MAX = 100_000;

function validerValeurD(valeur: unknown): { ok: true; valeur: number } | { ok: false; erreur: string } {
  const n = Number(valeur);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { ok: false, erreur: 'La valeur de D doit être un nombre entier de francs.' };
  }
  if (n < D_MIN || n > D_MAX) {
    return {
      ok: false,
      erreur: `Valeur de D hors limites (${D_MIN} à ${D_MAX} FCFA). Vérifiez la saisie.`,
    };
  }
  return { ok: true, valeur: n };
}

export async function GET() {
  // Lecture ouverte à qui établit un devis (module 4, le praticien choisit sa
  // base sans accéder à la Configuration) ET à la comptabilité (module 8) :
  // ce sont les conventions qui expliquent qu'un même acte soit facturé à deux
  // montants différents. Sans cet accès, un écart entre deux factures restait
  // inexplicable pour la personne chargée de les justifier.
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  const role = await getRoleById(session.roleId);
  if (
    !role ||
    (!hasPermission(role.permissions, 4, 'view') && !hasPermission(role.permissions, 8, 'view'))
  ) {
    return NextResponse.json({ error: 'Rôle non autorisé.' }, { status: 403 });
  }

  const conventions = await sql`
    select id, nom, valeur_d, actif from conventions
    where actif = true
    order by nom asc
  `;

  const reglages = await sql`select valeur_d from clinic_settings limit 1`;
  const valeurCabinet = Number(reglages[0]?.valeur_d ?? 1200);

  return NextResponse.json({ conventions, valeurCabinet });
}

export async function POST(request: Request) {
  // Écriture réservée à la Configuration : fixer une base tarifaire engage la
  // facturation du cabinet.
  const { session, error, status } = await requirePermission(21, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const nom = bornerTexte((body as { nom?: string }).nom, 80);
  if (!nom) {
    return NextResponse.json({ error: "Le nom de la convention est requis." }, { status: 400 });
  }

  const verif = validerValeurD((body as { valeurD?: unknown }).valeurD);
  if (!verif.ok) return NextResponse.json({ error: verif.erreur }, { status: 400 });

  const existe = await sql`select id from conventions where lower(nom) = lower(${nom}) limit 1`;
  if (existe.length > 0) {
    return NextResponse.json(
      { error: `Une convention nommée « ${nom} » existe déjà.` },
      { status: 409 }
    );
  }

  const rows = await sql`
    insert into conventions (nom, valeur_d)
    values (${nom}, ${verif.valeur})
    returning id, nom, valeur_d, actif
  `;

  await recordAudit({
    actorId: session!.userId,
    action: 'convention.create',
    entityTable: 'conventions',
    entityId: rows[0].id as string,
    meta: { nom, valeurD: verif.valeur },
  });

  return NextResponse.json({ convention: rows[0] });
}

export async function PATCH(request: Request) {
  const { session, error, status } = await requirePermission(21, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json() as { id?: string; valeurD?: unknown; actif?: boolean };
  if (!body.id) {
    return NextResponse.json({ error: 'id est requis.' }, { status: 400 });
  }

  // Modification ciblée : on ne renvoie que ce qui change, jamais le reste de
  // la ligne — un formulaire ne doit pas écraser ce qu'il n'a pas chargé.
  if (body.valeurD !== undefined) {
    const verif = validerValeurD(body.valeurD);
    if (!verif.ok) return NextResponse.json({ error: verif.erreur }, { status: 400 });
    await sql`update conventions set valeur_d = ${verif.valeur}, updated_at = now() where id = ${body.id}`;
  }
  if (body.actif !== undefined) {
    await sql`update conventions set actif = ${!!body.actif}, updated_at = now() where id = ${body.id}`;
  }

  const rows = await sql`select id, nom, valeur_d, actif from conventions where id = ${body.id} limit 1`;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Convention introuvable.' }, { status: 404 });
  }

  await recordAudit({
    actorId: session!.userId,
    action: 'convention.update',
    entityTable: 'conventions',
    entityId: body.id,
    meta: { valeurD: rows[0].valeur_d, actif: rows[0].actif },
  });

  return NextResponse.json({ convention: rows[0] });
}
