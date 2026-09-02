import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Notification Orange Money.
//
// Orange n'expose pas de signature HMAC : la notification est authentifiée
// par le `notif_token` remis à la création du paiement et rappelé ici. On le
// compare à celui enregistré sur la facture, en temps constant, et on exige
// que le montant corresponde — sans quoi une notification forgée pourrait
// solder une facture.
//
// ⚠️ La documentation d'Orange n'étant accessible qu'avec un compte
// développeur, ce format doit être confronté au portail avant mise en
// service réelle.
export async function POST(request: Request) {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps illisible.' }, { status: 400 });
  }

  const orderId: string | undefined = payload?.order_id;
  const notifToken: string | undefined = payload?.notif_token;
  const statut: string | undefined = payload?.status;
  const montant = Number(payload?.amount);

  if (!orderId || !notifToken) {
    return NextResponse.json({ error: 'order_id et notif_token sont requis.' }, { status: 400 });
  }

  const rows = await sql`
    select id, total, status, payment_notif_token
    from invoices
    where id = ${orderId}
    limit 1
  `;
  const invoice = rows[0];

  if (!invoice || !invoice.payment_notif_token) {
    return NextResponse.json({ error: 'Notification non reconnue.' }, { status: 401 });
  }

  const attendu = Buffer.from(String(invoice.payment_notif_token));
  const recu = Buffer.from(String(notifToken));
  const jetonValide =
    attendu.length === recu.length && crypto.timingSafeEqual(attendu, recu);

  if (!jetonValide) {
    return NextResponse.json({ error: 'Jeton de notification invalide.' }, { status: 401 });
  }

  if (Number.isFinite(montant) && Math.round(montant) !== Math.round(Number(invoice.total))) {
    return NextResponse.json(
      { error: 'Le montant notifié ne correspond pas à la facture.' },
      { status: 400 }
    );
  }

  if (statut === 'SUCCESS' && invoice.status !== 'paid') {
    await sql`
      update invoices
      set status = 'paid', paid_at = now(), payment_provider = 'orange_money'
      where id = ${invoice.id} and status <> 'paid'
    `;
  }

  return NextResponse.json({ received: true, paid: statut === 'SUCCESS' });
}
