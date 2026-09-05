import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 Mo
const ALLOWED_TYPES = ['Panoramique', 'Intra-orale', 'Esthétique', 'Céphalométrique'];

// Module 14 (Imagerie) et non 5 (Réalisation) : les clichés sont des
// données de santé. Le rôle comptable dispose du module 5 en lecture pour
// facturer les actes, ce qui lui donnait aussi accès aux radiographies —
// contraire au principe du minimum nécessaire. Module 14 = admin et
// praticiens uniquement.
export async function GET(request: Request) {
  const { error, status } = await requirePermission(14, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  if (!patientId) {
    return NextResponse.json({ error: 'patientId est requis.' }, { status: 400 });
  }

  const images = await sql`
    select id, patient_id, blob_url, type, notes, mime_type, size_bytes, created_at
    from patient_images
    where patient_id = ${patientId}
    order by created_at desc
  `;

  return NextResponse.json({ images });
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(14, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const patientId = String(formData.get('patientId') || '');
  const type = String(formData.get('type') || 'Intra-orale');
  const notes = String(formData.get('notes') || '');

  if (!file || !patientId) {
    return NextResponse.json({ error: 'file et patientId sont requis.' }, { status: 400 });
  }
  // Le SVG passe le test « image/ » mais peut porter du script, et le fichier
  // est stocké en accès public : on l'exclut explicitement.
  if (file.type === 'image/svg+xml') {
    return NextResponse.json(
      { error: "Le format SVG n'est pas accepté pour un cliché." },
      { status: 400 }
    );
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Seules les images sont acceptées.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Image trop volumineuse (max 15 Mo).' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Type de cliché invalide.' }, { status: 400 });
  }

  // Vercel Blob génère un suffixe aléatoire non devinable dans l'URL — même
  // niveau de confidentialité que les documents patients (portal/documents).
  const blob = await put(`patient-images/${patientId}/${file.name}`, file, {
    access: 'public',
    contentType: file.type,
    addRandomSuffix: true,
  });

  const rows = await sql`
    insert into patient_images (patient_id, blob_url, type, notes, mime_type, size_bytes, uploaded_by)
    values (${patientId}, ${blob.url}, ${type}, ${notes || null}, ${file.type}, ${file.size}, ${session!.userId})
    returning id, patient_id, blob_url, type, notes, mime_type, size_bytes, created_at
  `;

  await recordAudit({
    actorId: session!.userId,
    action: 'Ajout cliché patient',
    entityTable: 'patient_images',
    entityId: rows[0].id,
    meta: { patientId, type },
  });

  return NextResponse.json({ image: rows[0] });
}

export async function DELETE(request: Request) {
  const { session, error, status } = await requirePermission(14, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id est requis.' }, { status: 400 });
  }

  const rows = await sql`delete from patient_images where id = ${id} returning id, patient_id`;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Cliché introuvable.' }, { status: 404 });
  }

  await recordAudit({
    actorId: session!.userId,
    action: 'Suppression cliché patient',
    entityTable: 'patient_images',
    entityId: id,
    meta: { patientId: rows[0].patient_id },
  });

  return NextResponse.json({ success: true });
}
