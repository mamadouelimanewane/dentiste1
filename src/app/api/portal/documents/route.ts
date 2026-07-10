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
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Fichier requis.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo).' }, { status: 400 });
  }

  // Vercel Blob génère un suffixe aléatoire non devinable dans l'URL — pas
  // d'URL signée nécessaire pour ce niveau de confidentialité.
  const blob = await put(`patient-documents/${session.patientId}/${file.name}`, file, {
    access: 'public',
    contentType: file.type,
  });

  await sql`
    insert into patient_documents (patient_id, uploaded_by_patient, file_name, blob_url, mime_type, size_bytes, visible_to_patient)
    values (${session.patientId}, true, ${file.name}, ${blob.url}, ${file.type}, ${file.size}, true)
  `;

  return NextResponse.json({ success: true, url: blob.url });
}
