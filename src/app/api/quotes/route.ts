import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validerListe, validerMontant, validerQuantite } from '@/lib/validation';
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

  const rows = await sql`
    insert into quotes (patient_id, practitioner_id, items, total, signed, created_by)
    values (${patientId}, ${session!.userId}, ${JSON.stringify(lignes.valeur)}::jsonb, ${totalCalcule}, ${!!signed}, ${session!.userId})
    returning *
  `;

  const quote = rows[0];

  await recordAudit({
    actorId: session!.userId,
    action: 'Création devis',
    entityTable: 'quotes',
    entityId: quote.id,
    meta: { patientId, total: quote.total, itemsCount: items.length },
  });

  return NextResponse.json({ quote });
}
