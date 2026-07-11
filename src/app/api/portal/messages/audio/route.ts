import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { put } from '@vercel/blob';
import { sql } from '@/lib/db';
import { PORTAL_COOKIE_NAME, verifyPortalSessionToken } from '@/lib/portal-session';

export const dynamic = 'force-dynamic';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE_NAME)?.value;
  const session = token ? await verifyPortalSessionToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'Session portail invalide.' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('audio') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Fichier audio requis.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo).' }, { status: 400 });
  }

  const blob = await put(`patient-voice-notes/${session.patientId}/${Date.now()}.webm`, file, {
    access: 'public',
    contentType: file.type || 'audio/webm',
  });

  const rows = await sql`
    insert into patient_messages (patient_id, channel, direction, body, status, media_url, media_type)
    values (${session.patientId}, 'portal', 'inbound', '[Note vocale]', 'received', ${blob.url}, ${file.type || 'audio/webm'})
    returning *
  `;

  return NextResponse.json({ message: rows[0] });
}
