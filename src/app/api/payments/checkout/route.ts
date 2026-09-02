import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { initiatePayment } from '@/lib/integrations/payment';

export async function POST(request: Request) {
  const { error, status } = await requirePermission(6, 'manage');
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
    // Sans clés CinetPay, cette branche marquait la facture « payée » alors
    // qu'aucun argent n'était encaissé : le cabinet voyait la facture soldée
    // et la comptabilité comptait un encaissement qui n'existait pas. Une
    // recette fictive est le pire défaut possible dans un logiciel de
    // gestion, on refuse donc plutôt que de simuler.
    if (process.env.PAYMENTS_DEMO_MODE !== 'true') {
      return NextResponse.json(
        {
          error:
            "Le paiement en ligne n'est pas configuré. Encaissez le règlement au cabinet (espèces, Wave, carte) puis enregistrez-le depuis la facture.",
        },
        { status: 503 }
      );
    }

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
