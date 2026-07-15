import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

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
  const { method, insuranceProvider, insurancePolicyNumber } = body as {
    method?: 'cash' | 'card' | 'insurance';
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
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

    const updatedRows = await sql`
      update invoices
      set status = 'pending', payment_method = 'insurance', payment_provider = 'manual'
      where id = ${params.id}
      returning *
    `;

    const claimRows = await sql`
      insert into insurance_claims (patient_id, invoice_id, provider, policy_number, claim_type, amount, created_by)
      values (${invoice.patient_id}, ${params.id}, ${insuranceProvider.trim()}, ${insurancePolicyNumber?.trim() || null}, 'Facturation', ${invoice.total}, ${session!.userId})
      returning *
    `;

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

  return NextResponse.json({ invoice: rows[0] });
}
