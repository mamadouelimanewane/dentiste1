import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { initiatePayment, availableProviders, type PaymentProvider } from '@/lib/integrations/payment';

export const dynamic = 'force-dynamic';

// Ouvre un paiement mobile pour une facture, chez Wave ou Orange Money.
//
// La facture n'est jamais marquée payée ici : seule la notification du
// fournisseur, revérifiée auprès de lui, peut le faire. L'ancienne version
// marquait la facture « payée » dès que l'agrégateur n'était pas configuré,
// ce qui inscrivait une recette qui n'existait pas.
export async function POST(request: Request) {
  const { error, status } = await requirePermission(6, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { invoiceId, provider } = body as { invoiceId?: string; provider?: PaymentProvider };

  if (!invoiceId) {
    return NextResponse.json({ error: 'invoiceId est requis.' }, { status: 400 });
  }

  const disponibles = availableProviders();
  if (disponibles.length === 0) {
    return NextResponse.json(
      {
        error:
          "API Wave et Orange Money en cours de connexion. En attendant, encaissez le règlement au cabinet puis enregistrez-le depuis la facture.",
      },
      { status: 503 }
    );
  }

  const choisi = provider || disponibles[0];
  if (!disponibles.includes(choisi)) {
    return NextResponse.json(
      { error: `API ${choisi === 'wave' ? 'Wave' : 'Orange Money'} en cours de connexion.` },
      { status: 503 }
    );
  }

  const rows = await sql`select * from invoices where id = ${invoiceId} limit 1`;
  const invoice = rows[0];
  if (!invoice) {
    return NextResponse.json({ error: 'Facture introuvable.' }, { status: 404 });
  }
  if (invoice.status === 'paid') {
    return NextResponse.json({ error: 'Cette facture est déjà soldée.' }, { status: 400 });
  }

  const result = await initiatePayment({
    provider: choisi,
    invoiceId: invoice.id,
    amount: Number(invoice.total),
    description: `Facture ${invoice.invoice_number}`,
  });

  if (result.error || !result.redirectUrl) {
    return NextResponse.json({ error: result.error || 'Échec de la création du paiement.' }, { status: 502 });
  }

  // On note le fournisseur et la session pour pouvoir authentifier puis
  // vérifier la notification à venir. Le statut reste « impayé ».
  await sql`
    update invoices
    set payment_method = 'mobile_money',
        payment_provider = ${choisi},
        payment_session_id = ${result.sessionId ?? null},
        payment_notif_token = ${result.notifToken ?? null}
    where id = ${invoiceId}
  `;

  return NextResponse.json({ provider: choisi, redirectUrl: result.redirectUrl });
}

// Permet à l'interface de n'afficher que les moyens réellement disponibles,
// plutôt qu'un bouton qui échouera au clic.
export async function GET() {
  const { error, status } = await requirePermission(6, 'view');
  if (error) return NextResponse.json({ error }, { status });
  return NextResponse.json({ providers: availableProviders() });
}
