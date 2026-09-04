import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { bornerTexte, validerEcheance } from '@/lib/validation';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

export async function GET() {
  const { error, status } = await requirePermission(16, 'view');
  if (error) return NextResponse.json({ error }, { status });

  // File de travail, pas historique : voir la note de insurance-claims. Un
  // travail prothétique en attente depuis des semaines est celui qu'il ne
  // faut surtout pas perdre de vue ; il sortait pourtant de la liste dès que
  // 100 travaux plus récents existaient.
  const LIMITE = 200;

  const orders = await sql`
    select lo.*, p.full_name as patient_name
    from lab_orders lo
    join patients p on p.id = lo.patient_id
    order by
      case lo.status
        when 'a_envoyer' then 0
        when 'production' then 1
        when 'shipped' then 2
        else 3
      end,
      lo.created_at asc
    limit ${LIMITE}
  `;

  const compte = await sql`select count(*)::int as n from lab_orders`;
  const total = Number(compte[0]?.n ?? orders.length);

  return NextResponse.json({ orders, total, tronque: total > orders.length });
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(16, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId, actLabel, teinte, labName, expectedDelivery } = body as {
    patientId?: string;
    actLabel?: string;
    teinte?: string;
    labName?: string;
    expectedDelivery?: string;
  };

  if (!patientId || !actLabel || !labName) {
    return NextResponse.json({ error: 'patientId, actLabel et labName sont requis.' }, { status: 400 });
  }

  const acte = bornerTexte(actLabel, 200);
  const labo = bornerTexte(labName, 150);
  if (!acte || !labo) {
    return NextResponse.json({ error: "La prestation et le laboratoire sont requis." }, { status: 400 });
  }
  const echeance = validerEcheance(expectedDelivery);
  if (!echeance.ok) return NextResponse.json({ error: echeance.erreur }, { status: 400 });

  const rows = await sql`
    insert into lab_orders (patient_id, act_label, teinte, lab_name, expected_delivery, created_by)
    values (${patientId}, ${acte}, ${bornerTexte(teinte, 20)}, ${labo}, ${echeance.valeur}, ${session!.userId})
    returning *
  `;

  const order = rows[0];

  await recordAudit({
    actorId: session!.userId,
    action: 'Création ordre labo',
    entityTable: 'lab_orders',
    entityId: order.id,
    meta: { actLabel, labName, patientId },
  });

  return NextResponse.json({ order });
}

export async function PATCH(request: Request) {
  const { session, error, status } = await requirePermission(16, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { id, status: newStatus } = body as { id?: string; status?: 'production' | 'shipped' | 'completed' };

  if (!id || !newStatus) {
    return NextResponse.json({ error: 'id et status sont requis.' }, { status: 400 });
  }

  const rows = await sql`
    update lab_orders set status = ${newStatus}, updated_at = now()
    where id = ${id}
    returning *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Ordre labo introuvable.' }, { status: 404 });
  }

  const order = rows[0];

  await recordAudit({
    actorId: session!.userId,
    action: 'Changement statut ordre labo',
    entityTable: 'lab_orders',
    entityId: order.id,
    meta: { newStatus },
  });

  return NextResponse.json({ order });
}
