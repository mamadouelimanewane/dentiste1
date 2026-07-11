import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions';
import { sendWhatsAppMessage } from '@/lib/integrations/whatsapp';
import { sendSms } from '@/lib/integrations/sms';

// Point d'entrée unique pour l'envoi manuel (CommunicationHub) quel que
// soit le canal choisi — dispatche vers WhatsApp ou SMS.
export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(18, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId, phone, message, channel } = body as {
    patientId?: string;
    phone?: string;
    message?: string;
    channel?: 'whatsapp' | 'sms';
  };

  if (!phone || !message || !channel) {
    return NextResponse.json({ error: 'phone, message et channel sont requis.' }, { status: 400 });
  }

  const result =
    channel === 'sms'
      ? await sendSms({ patientId, phone, body: message, sentBy: session!.userId })
      : await sendWhatsAppMessage({ patientId, phone, body: message, sentBy: session!.userId });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(result);
}
