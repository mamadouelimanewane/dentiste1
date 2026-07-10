import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { initiatePayment } from '@/lib/integrations/payment';

export async function POST(request: Request) {
  const { error, status } = await requireRole(['admin', 'praticien', 'accueil', 'comptable']);
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { invoiceId } = body as { invoiceId?: string };

  if (!invoiceId) {
    return NextResponse.json({ error: 'invoiceId est requis.' }, { status: 400 });
  }

  const rows = await sql`select * from invoices where id = ${invoiceId} limit 1`;
  const invoice = rows[0];
  if (!invoice) {
    return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 });
  }

  const result = await initiatePayment({
    invoiceId: invoice.id,
    amount: Number(invoice.total),
    description: `Facture ${invoice.invoice_number}`,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  if (result.simulated) {
    // Pas de clé CinetPay configurée : on marque la facture payée
    // immédiatement pour permettre de démontrer le flux de bout en bout.
    await sql`
      update invoices
      set status = 'paid', payment_method = 'mobile_money', payment_provider = 'simulated', paid_at = now()
      where id = ${invoiceId}
    `;
    return NextResponse.json({ simulated: true });
  }

  await sql`
    update invoices
    set status = 'pending', payment_method = 'mobile_money', payment_provider = 'cinetpay', payment_reference = ${result.providerReference}
    where id = ${invoiceId}
  `;

  return NextResponse.json({ simulated: false, redirectUrl: result.redirectUrl });
}
