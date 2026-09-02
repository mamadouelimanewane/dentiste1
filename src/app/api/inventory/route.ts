import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validerQuantite, validerMontant, bornerTexte } from '@/lib/validation';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

export async function GET() {
  const { error, status } = await requirePermission(19, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const items = await sql`select * from inventory_items order by name asc`;
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(19, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { ref, name, category, quantity, minThreshold, unitPrice } = body as {
    ref?: string;
    name?: string;
    category?: string;
    quantity?: number;
    minThreshold?: number;
    unitPrice?: number;
  };

  if (!name) {
    return NextResponse.json({ error: 'name est requis.' }, { status: 400 });
  }

  const nomArticle = bornerTexte(name, 150);
  if (!nomArticle) {
    return NextResponse.json({ error: "Le nom de l'article est requis." }, { status: 400 });
  }
  const qte = validerQuantite(quantity ?? 0);
  if (!qte.ok) return NextResponse.json({ error: qte.erreur }, { status: 400 });
  const seuil = validerQuantite(minThreshold ?? 0);
  if (!seuil.ok) return NextResponse.json({ error: seuil.erreur }, { status: 400 });
  const prix = validerMontant(unitPrice, { obligatoire: false });
  if (!prix.ok) return NextResponse.json({ error: prix.erreur }, { status: 400 });

  const rows = await sql`
    insert into inventory_items (ref, name, category, quantity, min_threshold, unit_price, updated_by)
    values (${ref || null}, ${nomArticle}, ${category || 'Divers'}, ${qte.valeur}, ${seuil.valeur}, ${prix.valeur}, ${session!.userId})
    returning *
  `;

  const item = rows[0];

  await recordAudit({
    actorId: session!.userId,
    action: 'Création article de stock',
    entityTable: 'inventory_items',
    entityId: item.id,
    meta: { name: item.name, quantity: item.quantity },
  });

  return NextResponse.json({ item });
}

export async function PATCH(request: Request) {
  const { session, error, status } = await requirePermission(19, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { id, quantityDelta, quantity } = body as {
    id?: string;
    quantityDelta?: number;
    quantity?: number;
  };

  if (!id) {
    return NextResponse.json({ error: 'id est requis.' }, { status: 400 });
  }

  // La voie « delta » était déjà bornée par greatest(0, ...). L'affectation
  // directe ne l'était pas : le stock pouvait tomber à -500, et une valeur
  // hors des bornes d'un integer PostgreSQL faisait planter la route en 500.
  if (quantityDelta !== undefined && !Number.isInteger(Number(quantityDelta))) {
    return NextResponse.json({ error: 'Mouvement de stock invalide.' }, { status: 400 });
  }
  if (quantity !== undefined) {
    const q = validerQuantite(quantity);
    if (!q.ok) return NextResponse.json({ error: q.erreur }, { status: 400 });
  }

  const rows = quantityDelta !== undefined
    ? await sql`
        update inventory_items
        set quantity = greatest(0, quantity + ${quantityDelta}), updated_by = ${session!.userId}, updated_at = now()
        where id = ${id}
        returning *
      `
    : await sql`
        update inventory_items
        set quantity = coalesce(${quantity ?? null}, quantity), updated_by = ${session!.userId}, updated_at = now()
        where id = ${id}
        returning *
      `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 });
  }

  const item = rows[0];

  await recordAudit({
    actorId: session!.userId,
    action: quantityDelta && quantityDelta > 0 ? 'Réassort stock' : 'Ajustement stock',
    entityTable: 'inventory_items',
    entityId: item.id,
    meta: { name: item.name, newQuantity: item.quantity, delta: quantityDelta },
  });

  return NextResponse.json({ item });
}
