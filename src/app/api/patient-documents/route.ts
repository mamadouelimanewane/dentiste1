import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// Documents du dossier, côté cabinet.
//
// La table `patient_documents` existait, le portail patient savait y déposer
// un fichier et l'écran du patient annonçait « Fichiers échangés avec le
// cabinet »… mais AUCUN écran du cabinet ne les lisait, et le cabinet ne
// pouvait rien partager en retour. Les deux directions de l'échange étaient
// donc fausses : un patient qui envoyait son bilan sanguin avant une
// extraction voyait « Envoyé », et personne ne le recevait jamais.
//
// Module 5 (dossier de soins) : les documents administratifs et médicaux
// suivent le dossier, pas l'imagerie (module 14, réservé aux praticiens).

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo, comme côté portail

// Type déclaré ET extension doivent concorder — le type seul vient du client
// et ne prouve rien. Même liste que le portail.
const TYPES_AUTORISES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
};

function nomSur(nom: string) {
  return nom.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'document';
}

export async function GET(request: Request) {
  const { error, status } = await requirePermission(5, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  if (!patientId) {
    return NextResponse.json({ error: 'patientId est requis.' }, { status: 400 });
  }

  const documents = await sql`
    select d.id, d.file_name, d.blob_url, d.mime_type, d.size_bytes,
           d.uploaded_by_patient, d.visible_to_patient, d.created_at,
           u.full_name as depose_par
    from patient_documents d
    left join users u on u.id = d.uploaded_by_user
    where d.patient_id = ${patientId}
    order by d.created_at desc
  `;

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(5, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const patientId = String(formData.get('patientId') || '');
  // Un document déposé par le cabinet n'est pas visible du patient par
  // défaut : un compte rendu interne n'a pas à partir au portail sans que
  // quelqu'un l'ait décidé.
  const visiblePatient = String(formData.get('visibleToPatient') || '') === 'true';

  if (!file || !patientId) {
    return NextResponse.json({ error: 'file et patientId sont requis.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo).' }, { status: 400 });
  }

  const nomFichier = nomSur(file.name || 'document');
  const extensions = TYPES_AUTORISES[file.type];
  if (!extensions || !extensions.some((e) => nomFichier.toLowerCase().endsWith(e))) {
    return NextResponse.json(
      { error: 'Format non accepté. Déposez un PDF ou une image (JPEG, PNG, WEBP, HEIC).' },
      { status: 400 }
    );
  }

  const blob = await put(`patient-documents/${patientId}/${nomFichier}`, file, {
    access: 'public',
    contentType: file.type,
    addRandomSuffix: true,
  });

  const rows = await sql`
    insert into patient_documents
      (patient_id, uploaded_by_user, file_name, blob_url, mime_type, size_bytes, visible_to_patient)
    values
      (${patientId}, ${session!.userId}, ${file.name}, ${blob.url}, ${file.type}, ${file.size}, ${visiblePatient})
    returning id, file_name, blob_url, mime_type, size_bytes, uploaded_by_patient, visible_to_patient, created_at
  `;

  await recordAudit({
    actorId: session!.userId,
    action: 'Ajout document au dossier patient',
    entityTable: 'patient_documents',
    entityId: rows[0].id as string,
    meta: { patientId, fichier: file.name, visiblePatient },
  });

  return NextResponse.json({ document: rows[0] });
}

// Rendre visible (ou masquer) au patient un document déjà au dossier.
export async function PATCH(request: Request) {
  const { session, error, status } = await requirePermission(5, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const { id, visibleToPatient } = (await request.json()) as {
    id?: string;
    visibleToPatient?: boolean;
  };
  if (!id || typeof visibleToPatient !== 'boolean') {
    return NextResponse.json({ error: 'id et visibleToPatient sont requis.' }, { status: 400 });
  }

  const rows = await sql`
    update patient_documents
    set visible_to_patient = ${visibleToPatient}
    where id = ${id}
    returning id, patient_id, file_name, visible_to_patient
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });
  }

  await recordAudit({
    actorId: session!.userId,
    action: visibleToPatient ? 'Document partagé avec le patient' : 'Document retiré du portail patient',
    entityTable: 'patient_documents',
    entityId: id,
    meta: { patientId: rows[0].patient_id, fichier: rows[0].file_name },
  });

  return NextResponse.json({ document: rows[0] });
}

export async function DELETE(request: Request) {
  const { session, error, status } = await requirePermission(5, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id est requis.' }, { status: 400 });

  // Ce qui sort du dossier d'un patient reste au journal, nom de fichier
  // compris : sinon, plus personne ne peut dire ce qui a été retiré.
  const rows = await sql`
    delete from patient_documents where id = ${id}
    returning id, patient_id, file_name, uploaded_by_patient
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });
  }

  await recordAudit({
    actorId: session!.userId,
    action: 'Suppression document du dossier patient',
    entityTable: 'patient_documents',
    entityId: id,
    meta: {
      patientId: rows[0].patient_id,
      fichier: rows[0].file_name,
      deposeParLePatient: rows[0].uploaded_by_patient,
    },
  });

  return NextResponse.json({ success: true });
}
