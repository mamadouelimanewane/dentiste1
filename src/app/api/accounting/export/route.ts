import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Export réel du journal des ventes et encaissements, au format CSV
// ouvrable directement dans Excel / LibreOffice. Remplace l'ancien bouton
// qui se contentait d'afficher "Exportation générée avec succès" sans rien
// produire.
function csvCell(value: unknown) {
  let s = String(value ?? '');

  // Injection de formule : Excel interprète toute cellule commençant par
  // = + - @ (ou une tabulation) comme une formule. Or un patient saisit
  // lui-même son nom lors d'une prise de rendez-vous en ligne — sans ce
  // préfixe, ce nom s'exécuterait sur le poste du comptable à l'ouverture
  // du journal. L'apostrophe force Excel à traiter la cellule comme du texte.
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }

  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const { error, status } = await requirePermission(8, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const start = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  // Même correctif que le résumé comptable : une date seule vaut minuit, ce
  // qui excluait les factures du jour même de l'export.
  const end = to ? new Date(to) : new Date();
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    end.setUTCHours(23, 59, 59, 999);
  }

  const rows = await sql`
    select i.invoice_number, i.total, i.status, i.payment_method, i.created_at, i.paid_at,
           p.full_name as patient_name, p.dossier_number,
           coalesce((
             select sum(c.amount) from insurance_claims c
             where c.invoice_id = i.id and c.status = 'pending'
           ), 0)::numeric as part_mutuelle
    from invoices i
    join patients p on p.id = i.patient_id
    where i.created_at >= ${start} and i.created_at <= ${end}
    order by i.created_at asc
  `;

  const header = [
    'Journal', 'Date', 'Piece', 'Compte SYSCOA', 'Libelle', 'Dossier', 'Debit', 'Credit',
  ];
  const lines: string[][] = [];

  const fmtDate = (d: string | Date | null) =>
    d ? new Date(d).toLocaleDateString('fr-FR') : '';

  for (const inv of rows as any[]) {
    const total = Number(inv.total);
    lines.push(['VT', fmtDate(inv.created_at), inv.invoice_number, '411', `Client - ${inv.patient_name}`, inv.dossier_number, String(total), '0']);
    lines.push(['VT', fmtDate(inv.created_at), inv.invoice_number, '706', `Honoraires et soins - ${inv.patient_name}`, inv.dossier_number, '0', String(total)]);

    if (inv.status === 'paid') {
      const enCaisse = inv.payment_method === 'cash';
      lines.push([enCaisse ? 'CA' : 'BQ', fmtDate(inv.paid_at || inv.created_at), inv.invoice_number, enCaisse ? '571' : '521', enCaisse ? 'Caisse - encaissement especes' : `Banque - reglement ${inv.payment_method || ''}`, inv.dossier_number, String(total), '0']);
      lines.push([enCaisse ? 'CA' : 'BQ', fmtDate(inv.paid_at || inv.created_at), inv.invoice_number, '411', `Solde creance - ${inv.patient_name}`, inv.dossier_number, '0', String(total)]);
    } else {
      // Même logique que le résumé comptable : la part réellement demandée à
      // une mutuelle, sinon la facture entière si elle a été basculée « chez
      // la mutuelle » sans demande détaillée. Sans cela, le CSV remis au
      // comptable contredisait le journal affiché à l'écran.
      const partMutuelle = Math.min(
        Number(inv.part_mutuelle) || (inv.payment_method === 'insurance' ? total : 0),
        total
      );
      if (partMutuelle > 0) {
        lines.push(['OD', fmtDate(inv.created_at), inv.invoice_number, '4116', `Transfert creance mutuelle - ${inv.patient_name}`, inv.dossier_number, String(partMutuelle), '0']);
        lines.push(['OD', fmtDate(inv.created_at), inv.invoice_number, '411', `Solde creance patient - ${inv.patient_name}`, inv.dossier_number, '0', String(partMutuelle)]);
      }
    }
  }

  // Séparateur ';' et BOM UTF-8 : Excel en configuration francophone ouvre
  // alors le fichier avec les colonnes et les accents corrects.
  const csv = '﻿' + [header, ...lines].map((r) => r.map(csvCell).join(';')).join('\r\n');
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="journal-comptable-${stamp}.csv"`,
    },
  });
}
