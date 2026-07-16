import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
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

  const rows = await sql`
    insert into inventory_items (ref, name, category, quantity, min_threshold, unit_price, updated_by)
    values (${ref || null}, ${name}, ${category || 'Divers'}, ${quantity || 0}, ${minThreshold || 0}, ${unitPrice || 0}, ${session!.userId})
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
