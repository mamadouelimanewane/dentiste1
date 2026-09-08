import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions';
import { executerSauvegarde, listerSauvegardes, RETENTION_JOURS } from '@/lib/integrations/sauvegarde';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Liste des sauvegardes réellement présentes dans le magasin. Ce n'est pas un
// journal de tentatives : ce qui s'affiche ici existe et peut être téléchargé.
export async function GET() {
  const { error, status } = await requirePermission(22, 'view');
  if (error) return NextResponse.json({ error }, { status });

  try {
    const sauvegardes = await listerSauvegardes();
    return NextResponse.json({ sauvegardes, retentionJours: RETENTION_JOURS });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Sauvegardes illisibles.' },
      { status: 502 }
    );
  }
}

// Sauvegarde immédiate. À faire avant toute opération risquée — une purge, une
// reprise de données, un changement de paramétrage massif.
export async function POST() {
  const { session, error, status } = await requirePermission(22, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  try {
    const r = await executerSauvegarde();
    await recordAudit({
      actorId: session!.userId,
      action: 'sauvegarde_manuelle',
      entityTable: 'sauvegardes',
      meta: { chemin: r.chemin, tables: r.tables, lignes: r.lignes },
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'La sauvegarde a échoué.' },
      { status: 502 }
    );
  }
}
