import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyWaveSignature, verifyWaveSession } from '@/lib/integrations/payment';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// Notification Wave. Deux garde-fous, tous deux nécessaires :
//   1. la signature `Wave-Signature` authentifie l'expéditeur ;
//   2. le statut est malgré tout revérifié auprès de Wave, car une
//      notification authentique peut annoncer autre chose qu'un paiement
//      abouti — et c'est l'argent réellement reçu qui fait foi.
export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyWaveSignature(rawBody, request.headers.get('wave-signature'))) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Corps illisible.' }, { status: 400 });
  }

  const data = payload?.data || payload;
  const sessionId: string | undefined = data?.id;
  const reference: string | undefined = data?.client_reference;

  if (!sessionId && !reference) {
    return NextResponse.json({ error: 'Session introuvable dans la notification.' }, { status: 400 });
  }

  const rows = reference
    ? await sql`select id, status from invoices where id = ${reference} limit 1`
    : await sql`select id, status from invoices where payment_session_id = ${sessionId!} limit 1`;

  const invoice = rows[0];
  if (!invoice) {
    // Notification signée mais sans facture correspondante : on l'accepte
    // sans rien changer, pour que Wave cesse de la rejouer.
    return NextResponse.json({ received: true, matched: false });
  }

  const { paid } = await verifyWaveSession(sessionId || String(invoice.id));

  if (paid && invoice.status !== 'paid') {
    // `payment_method` doit être renseigné, et pas seulement le fournisseur.
    //
    // La comptabilité ventile la trésorerie ainsi : `payment_method = 'cash'`
    // en caisse, `payment_method <> 'cash'` en banque. Or en SQL, une
    // comparaison avec NULL n'est pas vraie : une facture réglée par Wave,
    // dont le moyen restait vide, n'entrait NI en caisse NI en banque — tout
    // en étant comptée dans les encaissements. La trésorerie ne bouclait
    // donc pas, et personne n'aurait su d'où venait l'écart.
    const misesAJour = await sql`
      update invoices
      set status = 'paid', paid_at = now(),
          payment_method = 'mobile_money', payment_provider = 'wave'
      where id = ${invoice.id} and status <> 'paid'
      returning id, total, patient_id
    `;

    // Un règlement au comptoir laisse une trace ; un règlement arrivé par
    // notification n'en laissait aucune.
    if (misesAJour.length > 0) {
      await recordAudit({
        actorId: null,
        action: 'Règlement facture (notification Wave)',
        entityTable: 'invoices',
        entityId: String(invoice.id),
        meta: {
          method: 'mobile_money',
          provider: 'wave',
          amount: Number(misesAJour[0].total),
          patientId: misesAJour[0].patient_id,
        },
      });
    }
  }

  return NextResponse.json({ received: true, paid });
}
