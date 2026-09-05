import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { put } from '@vercel/blob';
import { sql } from '@/lib/db';
import { PORTAL_COOKIE_NAME, verifyPortalSessionToken } from '@/lib/portal-session';

export const dynamic = 'force-dynamic';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo

// Ce dépôt est ouvert au patient : il choisit le fichier ET le type déclaré.
// Sans liste blanche, il pouvait déposer une page HTML ou un SVG porteur de
// script, stocké en accès public et servi avec le type qu'il avait annoncé.
// Le personnel qui ouvre la pièce jointe atterrissait alors sur un contenu
// qu'un tiers contrôle. On n'accepte que ce qu'un patient envoie réellement :
// une photo ou un document.
//
// Le SVG est exclu délibérément, malgré son statut d'image : il peut porter
// du script.
const TYPES_AUTORISES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
};

// Plafond par patient et par jour : le dépôt n'a aucune limite de débit, un
// patient pouvait saturer le stockage du cabinet à coups de fichiers de 10 Mo.
const MAX_PAR_JOUR = 10;

// Le nom fourni sert de chemin de stockage : on le réduit à un nom de fichier
// simple, sans séparateur ni caractère de contrôle.
function nomSur(nom: string) {
  const base = nom.split(/[/\\]/).pop() || 'document';
  // Les lettres accentuées sont conservées : un cabinet francophone reçoit des
  // fichiers nommés « radio Aïssatou.pdf », et les mutiler en « A_ssatou »
  // rendrait la pièce jointe méconnaissable pour le personnel.
  return (
    base.replace(/[^A-Za-z0-9À-ÿ._ -]+/g, '_').slice(0, 120) || 'document'
  );
}

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

  const nomFichier = nomSur(file.name || 'document');
  const extensions = TYPES_AUTORISES[file.type];
  const extensionOk = extensions?.some((e) => nomFichier.toLowerCase().endsWith(e));
  // On exige que le type déclaré ET l'extension concordent : le type seul
  // vient du client et ne prouve rien.
  if (!extensions || !extensionOk) {
    return NextResponse.json(
      { error: 'Format non accepté. Envoyez une photo (JPEG, PNG, WEBP, HEIC) ou un PDF.' },
      { status: 400 }
    );
  }

  const recents = await sql`
    select count(*)::int as n from patient_documents
    where patient_id = ${session.patientId}
      and uploaded_by_patient = true
      and created_at > now() - interval '24 hours'
  `;
  if (Number(recents[0]?.n ?? 0) >= MAX_PAR_JOUR) {
    return NextResponse.json(
      { error: `Limite de ${MAX_PAR_JOUR} documents par jour atteinte. Contactez le cabinet.` },
      { status: 429 }
    );
  }

  // Vercel Blob génère un suffixe aléatoire non devinable dans l'URL — pas
  // d'URL signée nécessaire pour ce niveau de confidentialité.
  const blob = await put(`patient-documents/${session.patientId}/${nomFichier}`, file, {
    access: 'public',
    contentType: file.type,
  });

  await sql`
    insert into patient_documents (patient_id, uploaded_by_patient, file_name, blob_url, mime_type, size_bytes, visible_to_patient)
    values (${session.patientId}, true, ${file.name}, ${blob.url}, ${file.type}, ${file.size}, true)
  `;

  return NextResponse.json({ success: true, url: blob.url });
}
