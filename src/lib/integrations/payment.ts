import 'server-only';
import crypto from 'crypto';

// Paiement mobile : Wave et Orange Money, en intégration directe.
//
// L'application passait auparavant par l'agrégateur CinetPay. Les deux
// fournisseurs sont désormais appelés directement — c'est ce que le cabinet
// utilise réellement au Sénégal, et cela évite une commission d'intermédiaire.
//
// Aucun mode simulé : sans identifiants, l'initiation échoue explicitement.
// Marquer une facture « payée » sans qu'aucun argent ne soit arrivé
// fabriquerait une recette, ce qui est le pire défaut possible dans un
// logiciel de gestion.

const WAVE_API_KEY = process.env.WAVE_API_KEY;
const WAVE_WEBHOOK_SECRET = process.env.WAVE_WEBHOOK_SECRET;

const OM_CLIENT_ID = process.env.ORANGE_MONEY_CLIENT_ID;
const OM_CLIENT_SECRET = process.env.ORANGE_MONEY_CLIENT_SECRET;
const OM_MERCHANT_KEY = process.env.ORANGE_MONEY_MERCHANT_KEY;
// L'URL de base change entre le bac à sable ("dev") et la production
// ("sn" pour le Sénégal) — elle reste donc paramétrable.
const OM_BASE_URL =
  process.env.ORANGE_MONEY_BASE_URL || 'https://api.orange.com/orange-money-webpay/dev/v1';
const OM_CURRENCY = process.env.ORANGE_MONEY_CURRENCY || 'OUV';

export type PaymentProvider = 'wave' | 'orange_money';

export function isWaveConfigured() {
  return !!WAVE_API_KEY;
}

export function isOrangeMoneyConfigured() {
  return !!OM_CLIENT_ID && !!OM_CLIENT_SECRET && !!OM_MERCHANT_KEY;
}

export function isPaymentConfigured() {
  return isWaveConfigured() || isOrangeMoneyConfigured();
}

export function availableProviders(): PaymentProvider[] {
  const out: PaymentProvider[] = [];
  if (isWaveConfigured()) out.push('wave');
  if (isOrangeMoneyConfigured()) out.push('orange_money');
  return out;
}

export interface InitiateResult {
  redirectUrl?: string;
  sessionId?: string;
  notifToken?: string;
  error?: string;
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

// ─── Wave ────────────────────────────────────────────────────────────────
// https://api.wave.com — POST /v1/checkout/sessions
// Réponse : { id, wave_launch_url, payment_status }

async function initiateWave(params: {
  invoiceId: string;
  amount: number;
  description: string;
}): Promise<InitiateResult> {
  try {
    const res = await fetch('https://api.wave.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WAVE_API_KEY}`,
        'Content-Type': 'application/json',
        // Rejoue sans risque : Wave renvoie la session existante plutôt que
        // d'en créer une seconde si le cabinet reclique.
        'Idempotency-Key': params.invoiceId,
      },
      body: JSON.stringify({
        amount: String(params.amount),
        currency: 'XOF',
        client_reference: params.invoiceId,
        success_url: `${getBaseUrl()}/dashboard`,
        error_url: `${getBaseUrl()}/dashboard`,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data?.message || data?.error_message || 'Échec de la création du paiement Wave.' };
    }
    return { redirectUrl: data.wave_launch_url, sessionId: data.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur réseau (Wave).' };
  }
}

// Vérifie l'état d'une session auprès de Wave. Utilisé après notification :
// on ne fait jamais confiance au seul contenu reçu.
export async function verifyWaveSession(sessionId: string): Promise<{ paid: boolean; error?: string }> {
  if (!isWaveConfigured()) return { paid: false, error: 'Wave non configuré.' };
  try {
    const res = await fetch(`https://api.wave.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${WAVE_API_KEY}` },
    });
    const data = await res.json();
    if (!res.ok) return { paid: false, error: data?.message || 'Vérification Wave impossible.' };
    return { paid: data.payment_status === 'succeeded' };
  } catch (e) {
    return { paid: false, error: e instanceof Error ? e.message : 'Erreur réseau (Wave).' };
  }
}

// Signature des webhooks Wave : en-tête `Wave-Signature: t=<ts>,v1=<sig>`,
// HMAC-SHA256 de `<ts>.<corps brut>` avec le secret de signature.
export function verifyWaveSignature(rawBody: string, header: string | null): boolean {
  if (!WAVE_WEBHOOK_SECRET || !header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k?.trim(), v?.trim()];
    })
  ) as { t?: string; v1?: string };

  if (!parts.t || !parts.v1) return false;

  const attendu = crypto
    .createHmac('sha256', WAVE_WEBHOOK_SECRET)
    .update(`${parts.t}.${rawBody}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(attendu), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}

// ─── Orange Money ────────────────────────────────────────────────────────
// Jeton OAuth2 (client_credentials) puis création d'un paiement web.
// ⚠️ La documentation d'Orange n'est accessible qu'avec un compte
// développeur : cette implémentation suit la forme documentée par les SDK
// publics et doit être confrontée au portail Orange avant mise en service.

async function orangeToken(): Promise<{ token?: string; error?: string }> {
  try {
    const auth = Buffer.from(`${OM_CLIENT_ID}:${OM_CLIENT_SECRET}`).toString('base64');
    const res = await fetch('https://api.orange.com/oauth/v3/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) {
      return { error: data?.error_description || "Jeton Orange Money refusé." };
    }
    return { token: data.access_token };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur réseau (Orange Money).' };
  }
}

async function initiateOrangeMoney(params: {
  invoiceId: string;
  amount: number;
  description: string;
}): Promise<InitiateResult> {
  const { token, error } = await orangeToken();
  if (!token) return { error };

  try {
    const res = await fetch(`${OM_BASE_URL}/webpayment`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_key: OM_MERCHANT_KEY,
        currency: OM_CURRENCY,
        order_id: params.invoiceId,
        amount: params.amount,
        return_url: `${getBaseUrl()}/dashboard`,
        cancel_url: `${getBaseUrl()}/dashboard`,
        notif_url: `${getBaseUrl()}/api/payments/orange/notify`,
        lang: 'fr',
        reference: params.description.slice(0, 30),
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.payment_url) {
      return { error: data?.message || data?.description || "Échec de la création du paiement Orange Money." };
    }
    return {
      redirectUrl: data.payment_url,
      sessionId: data.pay_token,
      notifToken: data.notif_token,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur réseau (Orange Money).' };
  }
}

// ─── Point d'entrée commun ───────────────────────────────────────────────

export async function initiatePayment(params: {
  provider: PaymentProvider;
  invoiceId: string;
  amount: number;
  description: string;
}): Promise<InitiateResult> {
  if (params.provider === 'wave') {
    if (!isWaveConfigured()) return { error: "Wave n'est pas configuré." };
    return initiateWave(params);
  }
  if (!isOrangeMoneyConfigured()) return { error: "Orange Money n'est pas configuré." };
  return initiateOrangeMoney(params);
}
