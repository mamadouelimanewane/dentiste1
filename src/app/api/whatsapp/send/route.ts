import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions';
import { sendWhatsAppMessage } from '@/lib/integrations/whatsapp';

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(18, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId, phone, message } = body as {
    patientId?: string;
    phone?: string;
    message?: string;
  };

  if (!phone || !message) {
    return NextResponse.json({ error: 'phone et message sont requis.' }, { status: 400 });
  }

  const result = await sendWhatsAppMessage({
    patientId,
    phone,
    body: message,
    sentBy: session!.userId,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(result);
}
