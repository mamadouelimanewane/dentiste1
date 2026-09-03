import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { genererExplication, isExplicationConfigured, type ActePlan } from '@/lib/integrations/explication';

export const dynamic = 'force-dynamic';

// Historique des explications d'un patient.
export async function GET(request: Request) {
  const { error, status } = await requirePermission(4, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  if (!patientId) {
    return NextResponse.json({ error: 'patientId est requis.' }, { status: 400 });
  }

  const rows = await sql`
    select id, quote_id, source, texte_fr, texte_wo, modele, valide_le, envoye_le, created_at
    from patient_explanations
    where patient_id = ${patientId}
    order by created_at desc
    limit 20
  `;

  return NextResponse.json({ explications: rows, disponible: isExplicationConfigured() });
}

// Rédige l'explication d'un plan de soins.
//
// Les actes et les montants sont relus **en base** : le client ne transmet
// qu'un identifiant. Une reformulation ne doit jamais pouvoir porter des
// chiffres différents de ceux du dossier.
export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(4, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId, quoteId } = body as { patientId?: string; quoteId?: string };

  if (!patientId) {
    return NextResponse.json({ error: 'patientId est requis.' }, { status: 400 });
  }

  const patients = await sql`select id, full_name, mutuelle from patients where id = ${patientId} limit 1`;
  const patient = patients[0];
  if (!patient) {
    return NextResponse.json({ error: 'Patient introuvable.' }, { status: 404 });
  }

  let actes: ActePlan[] = [];
  let total = 0;

  if (quoteId) {
    const devis = await sql`
      select id, items, total from quotes where id = ${quoteId} and patient_id = ${patientId} limit 1
    `;
    if (!devis[0]) {
      return NextResponse.json({ error: 'Devis introuvable pour ce patient.' }, { status: 404 });
    }
    const items = Array.isArray(devis[0].items) ? devis[0].items : [];
    actes = items.map((i: any) => ({
      label: String(i.label || 'Acte'),
      prix: Number(i.price) || 0,
      quantite: Number(i.qty) || 1,
    }));
    total = Number(devis[0].total) || 0;
  } else {
    // À défaut de devis, on explique les actes réalisés non encore facturés.
    const rows = await sql`
      select label, tooth, price from executed_acts
      where patient_id = ${patientId} and invoice_id is null
      order by performed_at asc
    `;
    actes = rows.map((r) => ({
      label: String(r.label),
      dent: r.tooth as number | null,
      prix: Number(r.price) || 0,
    }));
    total = actes.reduce((s, a) => s + a.prix * (a.quantite || 1), 0);
  }

  if (actes.length === 0) {
    return NextResponse.json(
      { error: "Aucun acte à expliquer. Établissez d'abord un devis ou saisissez les soins." },
      { status: 400 }
    );
  }

  // Part mutuelle réellement demandée, s'il en existe une non soldée.
  const claims = await sql`
    select coalesce(sum(c.amount), 0)::numeric as part
    from insurance_claims c
    join invoices i on i.id = c.invoice_id
    where i.patient_id = ${patientId}
      and c.status in ('pending', 'submitted', 'approved')
  `;
  const partMutuelle = Number(claims[0]?.part || 0) || null;

  const resultat = await genererExplication({
    patientNom: patient.full_name as string,
    actes,
    total,
    partMutuelle,
    nomMutuelle: (patient.mutuelle as string) || null,
  });

  if (resultat.error || !resultat.texteFr) {
    return NextResponse.json({ error: resultat.error || 'Échec de la rédaction.' }, { status: 502 });
  }

  const rows = await sql`
    insert into patient_explanations
      (patient_id, quote_id, source, texte_fr, texte_wo, modele, created_by)
    values (
      ${patientId},
      ${quoteId || null},
      ${JSON.stringify({ actes, total, partMutuelle })}::jsonb,
      ${resultat.texteFr},
      ${resultat.texteWo || null},
      ${resultat.modele},
      ${session!.userId}
    )
    returning id, texte_fr, texte_wo, source, modele, created_at
  `;

  return NextResponse.json({ explication: rows[0] });
}
