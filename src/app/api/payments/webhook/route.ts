import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyPayment } from '@/lib/integrations/payment';

export const dynamic = 'force-dynamic';

// Notification serveur-à-serveur CinetPay après paiement. CinetPay envoie
// le transaction_id (= notre invoiceId) ; on revérifie toujours le statut
// auprès de leur API plutôt que de faire confiance au payload reçu.
export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  let invoiceId: string | undefined;

  if (contentType.includes('application/json')) {
    const body = await request.json();
    invoiceId = body.cpm_trans_id || body.transaction_id;
  } else {
    const form = await request.formData();
    invoiceId = (form.get('cpm_trans_id') || form.get('transaction_id'))?.toString();
  }

  if (!invoiceId) {
    return NextResponse.json({ error: 'transaction_id manquant.' }, { status: 400 });
  }

  const { paid } = await verifyPayment(invoiceId);

  if (paid) {
    await sql`
      update invoices set status = 'paid', paid_at = now() where id = ${invoiceId} and status != 'paid'
    `;
  }

  return NextResponse.json({ received: true, paid });
}
