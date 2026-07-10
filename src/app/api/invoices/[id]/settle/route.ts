import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireRole } from '@/lib/session';

// Règlement manuel (espèces, carte, prise en charge mutuelle) attesté par
// le staff en présentiel — pas de flux réseau, contrairement au paiement
// mobile money via CinetPay (/api/payments/checkout).
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { error, status } = await requireRole(['admin', 'praticien', 'accueil', 'comptable']);
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { method } = body as { method?: 'cash' | 'card' | 'insurance' };

  if (!method) {
    return NextResponse.json({ error: 'method est requis.' }, { status: 400 });
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
