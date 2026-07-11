import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requirePermission } from '@/lib/permissions';
import { sendWhatsAppVoiceNote } from '@/lib/integrations/whatsapp';

export const dynamic = 'force-dynamic';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(18, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const formData = await request.formData();
  const file = formData.get('audio') as File | null;
  const phone = formData.get('phone') as string | null;
  const patientId = formData.get('patientId') as string | null;

  if (!file || !phone) {
    return NextResponse.json({ error: 'audio et phone sont requis.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo).' }, { status: 400 });
  }

  const blob = await put(`staff-voice-notes/${Date.now()}.webm`, file, {
    access: 'public',
    contentType: file.type || 'audio/webm',
  });

  const result = await sendWhatsAppVoiceNote({
    patientId: patientId || null,
    phone,
    mediaUrl: blob.url,
    sentBy: session!.userId,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(result);
}
