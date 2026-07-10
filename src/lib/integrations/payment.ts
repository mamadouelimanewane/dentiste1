import 'server-only';

const API_KEY = process.env.CINETPAY_API_KEY;
const SITE_ID = process.env.CINETPAY_SITE_ID;
const SECRET_KEY = process.env.CINETPAY_SECRET_KEY;

export function isPaymentConfigured() {
  return !!API_KEY && !!SITE_ID && !!SECRET_KEY;
}

interface InitiateResult {
  simulated: boolean;
  redirectUrl?: string;
  providerReference?: string;
  error?: string;
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

// Initie un paiement mobile money (Wave/Orange Money/Free Money via
// l'agrégateur CinetPay). Sans clés configurées, simule un paiement
// immédiatement accepté — l'appelant (checkout route) doit alors marquer
// la facture payée directement.
export async function initiatePayment(params: {
  invoiceId: string;
  amount: number;
  description: string;
}): Promise<InitiateResult> {
  if (!isPaymentConfigured()) {
    return { simulated: true };
  }

  try {
    const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: API_KEY,
        site_id: SITE_ID,
        transaction_id: params.invoiceId,
        amount: params.amount,
        currency: 'XOF',
        description: params.description,
        notify_url: `${getBaseUrl()}/api/payments/webhook`,
        return_url: `${getBaseUrl()}/api/payments/webhook`,
        channels: 'MOBILE_MONEY',
      }),
    });

    const data = await res.json();

    if (data.code !== '201') {
      return { simulated: false, error: data.message || 'Échec de l\'initialisation du paiement.' };
    }

    return {
      simulated: false,
      redirectUrl: data.data?.payment_url,
      providerReference: data.data?.payment_token,
    };
  } catch (e) {
    return { simulated: false, error: e instanceof Error ? e.message : 'Erreur réseau.' };
  }
}

export async function verifyPayment(invoiceId: string): Promise<{ paid: boolean; error?: string }> {
  if (!isPaymentConfigured()) {
    return { paid: false, error: 'Paiement non configuré.' };
  }

  try {
    const res = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apikey: API_KEY, site_id: SITE_ID, transaction_id: invoiceId }),
    });
    const data = await res.json();
    return { paid: data?.data?.status === 'ACCEPTED' };
  } catch (e) {
    return { paid: false, error: e instanceof Error ? e.message : 'Erreur réseau.' };
  }
}
