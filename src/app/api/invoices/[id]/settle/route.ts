import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

// Règlement manuel (espèces, carte, prise en charge mutuelle) attesté par
// le staff en présentiel — pas de flux réseau, contrairement au paiement
// mobile money via CinetPay (/api/payments/checkout).
//
// La méthode "insurance" ne constitue PAS un encaissement : elle ne fait que
// transmettre la facture à l'assureur. La facture passe donc en statut
// "pending" (pas "paid") et une ligne insurance_claims est créée pour que
// le module Mutuelles suive la réclamation jusqu'à son règlement réel.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { session, error, status } = await requirePermission(6, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { method, insuranceProvider, insurancePolicyNumber, coverageRate } = body as {
    method?: 'cash' | 'card' | 'insurance';
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    coverageRate?: number;
  };

  if (!method) {
    return NextResponse.json({ error: 'method est requis.' }, { status: 400 });
  }

  if (method === 'insurance') {
    if (!insuranceProvider?.trim()) {
      return NextResponse.json({ error: "Le nom de l'assureur / mutuelle est requis." }, { status: 400 });
    }

    const invoiceRows = await sql`select id, patient_id, total from invoices where id = ${params.id}`;
    const invoice = invoiceRows[0];
    if (!invoice) {
      return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 });
    }

    // Le taux de couverture était ignoré : la demande portait toujours sur
    // la totalité de la facture. Une mutuelle couvrant 80 % était donc
    // enregistrée comme devant 100 %, et le ticket modérateur du patient
    // disparaissait — le cabinet ne le lui réclamait jamais.
    const taux = Number(coverageRate);
    const tauxRetenu = Number.isFinite(taux) && taux > 0 && taux <= 100 ? taux : 100;
    const partMutuelle = Math.round((Number(invoice.total) * tauxRetenu) / 100);

    const updatedRows = await sql`
      update invoices
      set status = 'pending', payment_method = 'insurance', payment_provider = 'manual'
      where id = ${params.id}
      returning *
    `;

    // Sans cette recherche préalable, un double clic créait deux prises en
    // charge identiques pour la même facture : le comptable voyait deux
    // demandes pour un seul acte, et solder l'une sans l'autre faussait les
    // créances. On met donc à jour la demande non soldée si elle existe.
    const existante = await sql`
      select id from insurance_claims
      where invoice_id = ${params.id}
        and status in ('pending', 'submitted', 'approved')
      order by created_at asc
      limit 1
    `;

    const claimRows = existante.length
      ? await sql`
          update insurance_claims
          set provider = ${insuranceProvider.trim()},
              policy_number = ${insurancePolicyNumber?.trim() || null},
              amount = ${partMutuelle}
          where id = ${existante[0].id}
          returning *
        `
      : await sql`
          insert into insurance_claims (patient_id, invoice_id, provider, policy_number, claim_type, amount, created_by)
          values (${invoice.patient_id}, ${params.id}, ${insuranceProvider.trim()}, ${insurancePolicyNumber?.trim() || null}, 'Facturation', ${partMutuelle}, ${session!.userId})
          returning *
        `;

    await recordAudit({
      actorId: session!.userId,
      action: 'Transmission facture à une mutuelle',
      entityTable: 'invoices',
      entityId: params.id,
      meta: { provider: insuranceProvider.trim(), amount: partMutuelle, tauxCouverture: tauxRetenu },
    });

    return NextResponse.json({ invoice: updatedRows[0], claim: claimRows[0] });
  }

  const rows = await sql`
    update invoices
    set status = 'paid', payment_method = ${method}, payment_provider = 'manual', paid_at = now()
    where id = ${params.id}
    returning *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 });
  }

  await recordAudit({
    actorId: session!.userId,
    action: 'Règlement facture',
    entityTable: 'invoices',
    entityId: params.id,
    meta: { method, amount: rows[0].total },
  });

  return NextResponse.json({ invoice: rows[0] });
}
