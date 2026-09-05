import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

// Rectification et archivage d'une note clinique.
//
// Les deux opérations effaçaient purement et simplement l'antérieur : le
// PATCH écrasait le contenu, le DELETE retirait la ligne de la base. Rien
// n'en gardait trace, pas même le journal d'audit. Un dossier médical se
// rectifie ; il ne se réécrit pas en silence.
export async function PATCH(request: Request, { params }: { params: { noteId: string } }) {
  const { session, error, status } = await requirePermission(5, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { content } = body as { content?: string };

  if (!content) {
    return NextResponse.json({ error: 'content est requis' }, { status: 400 });
  }

  // Contenu antérieur lu avant l'écrasement : c'est lui que l'audit conserve.
  const avant = await sql`
    select content, patient_id from clinical_notes
    where id = ${params.noteId} and deleted_at is null
  `;
  if (avant.length === 0) {
    return NextResponse.json({ error: 'Note introuvable' }, { status: 404 });
  }

  const rows = await sql`
    update clinical_notes
    set content = ${content}, updated_at = now()
    where id = ${params.noteId} and deleted_at is null
    returning id, content, type, created_at, updated_at
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Note introuvable' }, { status: 404 });
  }

  await recordAudit({
    actorId: session!.userId,
    action: 'Rectification note clinique',
    entityTable: 'clinical_notes',
    entityId: params.noteId,
    meta: { patientId: avant[0].patient_id, contenuAnterieur: avant[0].content },
  });

  return NextResponse.json({ note: rows[0] });
}

export async function DELETE(request: Request, { params }: { params: { noteId: string } }) {
  const { session, error, status } = await requirePermission(5, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  // Archivage, pas suppression : la ligne reste en base, datée et signée,
  // et sort des listes. Voir db/migrations/0030.
  const rows = await sql`
    update clinical_notes
    set deleted_at = now(), deleted_by = ${session!.userId}
    where id = ${params.noteId} and deleted_at is null
    returning id, content, patient_id
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Note introuvable' }, { status: 404 });
  }

  await recordAudit({
    actorId: session!.userId,
    action: 'Archivage note clinique',
    entityTable: 'clinical_notes',
    entityId: params.noteId,
    meta: { patientId: rows[0].patient_id, contenu: rows[0].content },
  });

  return NextResponse.json({ success: true });
}
