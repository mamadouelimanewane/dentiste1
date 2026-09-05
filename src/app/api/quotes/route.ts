import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { bornerTexte, validerListe, validerMontant, validerQuantite } from '@/lib/validation';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

export async function GET(request: Request) {
  const { error, status } = await requirePermission(4, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  if (!patientId) {
    return NextResponse.json({ error: 'patientId est requis.' }, { status: 400 });
  }

  const quotes = await sql`
    select * from quotes where patient_id = ${patientId} order by created_at desc
  `;

  return NextResponse.json({ quotes });
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(4, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId, items, total, signed } = body as {
    patientId?: string;
    items?: { id: string; label: string; qty: number; price: number }[];
    total?: number;
    signed?: boolean;
  };

  if (!patientId || !items || items.length === 0) {
    return NextResponse.json({ error: 'patientId et items (non vide) sont requis.' }, { status: 400 });
  }

  // Le total était repris tel quel du client : un prix négatif produisait un
  // devis à montant négatif. On borne les lignes et on recalcule le total à
  // partir d'elles, plutôt que de faire confiance à la valeur envoyée.
  const lignes = validerListe(items, { max: 60, nom: 'acte' });
  if (!lignes.ok) return NextResponse.json({ error: lignes.erreur }, { status: 400 });

  let totalCalcule = 0;
  for (const brut of lignes.valeur as { label?: string; qty?: number; price?: number }[]) {
    const prix = validerMontant(brut?.price, { obligatoire: false });
    if (!prix.ok) return NextResponse.json({ error: prix.erreur }, { status: 400 });
    const qte = validerQuantite(brut?.qty ?? 1);
    if (!qte.ok) return NextResponse.json({ error: qte.erreur }, { status: 400 });
    totalCalcule += prix.valeur * qte.valeur;
  }

  // Base tarifaire appliquée, figée avec le devis : rééditer plus tard, après
  // un changement de convention, doit redonner le montant présenté au patient.
  const convention = bornerTexte((body as { convention?: string }).convention, 80);
  const valeurDBrute = Number((body as { valeurD?: unknown }).valeurD);
  const valeurD =
    Number.isFinite(valeurDBrute) && valeurDBrute >= 100 && valeurDBrute <= 100_000
      ? Math.round(valeurDBrute)
      : null;

  // Statut réel du devis.
  //
  // La colonne restait à sa valeur par défaut `draft`, et RIEN dans
  // l'application ne l'en faisait sortir. Or le portail patient n'affiche que
  // les devis dont le statut est différent de `draft` : la rubrique « Mes
  // devis » était donc structurellement vide, pour toujours. Un patient
  // signait son plan de traitement sur la tablette, rentrait chez lui, et ne
  // retrouvait rien.
  //
  // Un devis établi depuis le fauteuil est un devis présenté : il est
  // `sent`, et `accepted` s'il a été signé séance tenante.
  const statutInitial = signed ? 'accepted' : 'sent';

  const rows = await sql`
    insert into quotes (patient_id, practitioner_id, items, total, signed, status, created_by, convention, valeur_d)
    values (${patientId}, ${session!.userId}, ${JSON.stringify(lignes.valeur)}::jsonb, ${totalCalcule}, ${!!signed}, ${statutInitial}, ${session!.userId}, ${convention}, ${valeurD})
    returning *
  `;

  const quote = rows[0];

  await recordAudit({
    actorId: session!.userId,
    action: 'Création devis',
    entityTable: 'quotes',
    entityId: quote.id,
    meta: { patientId, total: quote.total, itemsCount: items.length, statut: statutInitial },
  });

  return NextResponse.json({ quote });
}

const STATUTS = ['draft', 'sent', 'accepted', 'rejected'] as const;
type StatutDevis = (typeof STATUTS)[number];

// Suite donnée à un devis.
//
// Aucun chemin ne permettait de faire évoluer un devis : il restait « en
// brouillon » à vie, le patient ne le voyait jamais sur son portail, et le
// cabinet n'avait aucun moyen de noter un refus.
export async function PATCH(request: Request) {
  const { session, error, status } = await requirePermission(4, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const { id, status: nouveauStatut } = (await request.json()) as {
    id?: string;
    status?: StatutDevis;
  };

  if (!id || !nouveauStatut) {
    return NextResponse.json({ error: 'id et status sont requis.' }, { status: 400 });
  }
  if (!STATUTS.includes(nouveauStatut)) {
    return NextResponse.json(
      { error: `Statut invalide. Valeurs acceptées : ${STATUTS.join(', ')}.` },
      { status: 400 }
    );
  }

  const rows = await sql`
    update quotes set status = ${nouveauStatut} where id = ${id}
    returning *
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Devis introuvable.' }, { status: 404 });
  }

  await recordAudit({
    actorId: session!.userId,
    action: `Devis ${nouveauStatut === 'accepted' ? 'accepté' : nouveauStatut === 'rejected' ? 'refusé' : 'mis à jour'}`,
    entityTable: 'quotes',
    entityId: id,
    meta: { patientId: rows[0].patient_id, total: rows[0].total, statut: nouveauStatut },
  });

  return NextResponse.json({ quote: rows[0] });
}
