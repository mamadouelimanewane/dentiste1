import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// Diagnostic en lecture seule : interroge le statut de livraison réel d'un
// message Twilio (sent/delivered/failed/undelivered + code d'erreur), utile
// quand l'API d'envoi répond "ok" mais que le destinataire ne reçoit rien
// (cas classique : numéro n'ayant pas rejoint le Sandbox WhatsApp).
export async function GET(request: Request) {
  const { error, status } = await requirePermission(18, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const sid = searchParams.get('sid');
  if (!sid) return NextResponse.json({ error: 'sid est requis.' }, { status: 400 });

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return NextResponse.json({ error: 'Twilio non configuré.' }, { status: 500 });
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages/${sid}.json`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      },
    }
  );
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data?.message || 'Erreur Twilio.' }, { status: res.status });
  }

  return NextResponse.json({
    sid: data.sid,
    status: data.status,
    to: data.to,
    from: data.from,
    errorCode: data.error_code,
    errorMessage: data.error_message,
    dateSent: data.date_sent,
    dateUpdated: data.date_updated,
  });
}
