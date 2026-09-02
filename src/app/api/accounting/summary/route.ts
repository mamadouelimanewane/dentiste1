import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// Comptabilité réelle, dérivée des factures et des prises en charge
// mutuelles. Le cabinet ne tient pas de comptabilité fournisseurs ni de
// plan comptable complet dans cette application : on n'expose donc que ce
// qui est réellement calculable (ventes, encaissements, créances), jamais
// un bilan ou des dettes fournisseurs inventés.
//
// Correspondance SYSCOA/OHADA appliquée :
//   706 "Services vendus"      -> facture émise (produit)
//   411 "Clients"              -> créance patient tant qu'elle n'est pas réglée
//   571 "Caisse"               -> règlement espèces
//   521 "Banque"               -> règlement carte / mobile money
//   4116 "Clients - organismes"-> facture transmise à une mutuelle
export async function GET(request: Request) {
  const { error, status } = await requirePermission(8, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const start = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);

  // Une date seule ("2026-09-02") est interprétée à minuit : la borne de fin
  // excluait donc toutes les factures du jour même. Un cabinet qui faisait sa
  // caisse le soir lisait 0 F. On étend la borne à la fin de la journée.
  const end = to ? new Date(to) : new Date();
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    end.setUTCHours(23, 59, 59, 999);
  }

  // Les créances mutuelles ne se déduisaient que du statut de la facture
  // (tout ou rien). Une demande de prise en charge enregistrée dans le module
  // Mutuelles n'avait donc aucun effet : une facture de 120 000 F dont 84 000
  // étaient attendus d'une IPM restait imputée en totalité au patient, et le
  // cabinet réclamait au patient ce que la mutuelle devait. On rattache
  // désormais la part réellement demandée à chaque facture.
  const [kpiRows, invoiceRows] = await Promise.all([
    sql`
      with parts as (
        select invoice_id, sum(amount)::numeric as part_mutuelle
        from insurance_claims
        -- Tant que l'organisme n'a ni payé ni refusé, la part reste due par
        -- lui : une demande transmise ou acceptée est toujours une créance.
        -- Une demande refusée retombe à la charge du patient, une demande
        -- payée sort des créances.
        where status in ('pending', 'submitted', 'approved') and invoice_id is not null
        group by invoice_id
      ),
      f as (
        select i.*,
               least(
                 coalesce(p.part_mutuelle, case when i.payment_method = 'insurance' then i.total else 0 end),
                 i.total
               ) as part_mutuelle
        from invoices i
        left join parts p on p.invoice_id = i.id
        where i.created_at >= ${start} and i.created_at <= ${end}
      )
      select
        coalesce(sum(total) filter (where status = 'paid'), 0)::numeric as encaissements,
        coalesce(sum(total) filter (where status = 'paid' and payment_method = 'cash'), 0)::numeric as caisse,
        coalesce(sum(total) filter (where status = 'paid' and payment_method <> 'cash'), 0)::numeric as banque,
        coalesce(sum(total - part_mutuelle) filter (where status = 'pending'), 0)::numeric as creances_patients,
        coalesce(sum(part_mutuelle) filter (where status = 'pending'), 0)::numeric as creances_mutuelles,
        coalesce(sum(total) filter (where status in ('paid', 'pending')), 0)::numeric as chiffre_affaires,
        count(*) filter (where status = 'pending')::int as factures_impayees
      from f
    `,
    sql`
      select i.id, i.invoice_number, i.total, i.status, i.payment_method,
             i.created_at, i.paid_at, p.full_name as patient_name,
             coalesce((
               select sum(c.amount) from insurance_claims c
               where c.invoice_id = i.id
                 and c.status in ('pending', 'submitted', 'approved')
             ), 0)::numeric as part_mutuelle
      from invoices i
      join patients p on p.id = i.patient_id
      where i.created_at >= ${start} and i.created_at <= ${end}
      order by i.created_at desc
      limit 500
    `,
  ]);

  const k = kpiRows[0] as Record<string, string>;

  // Journal en partie double reconstruit à partir des factures réelles :
  // une écriture de vente à l'émission, une écriture de règlement à
  // l'encaissement. Rien n'est inventé — si la facture n'est pas payée,
  // aucune ligne de trésorerie n'est produite.
  const journal: Array<Record<string, unknown>> = [];
  for (const inv of invoiceRows as any[]) {
    const total = Number(inv.total);
    const piece = inv.invoice_number;

    journal.push({
      journal: 'VT',
      date: inv.created_at,
      piece,
      compte: '411',
      libelle: `Client — ${inv.patient_name}`,
      debit: total,
      credit: 0,
    });
    journal.push({
      journal: 'VT',
      date: inv.created_at,
      piece,
      compte: '706',
      libelle: `Honoraires et soins — ${inv.patient_name}`,
      debit: 0,
      credit: total,
    });

    if (inv.status === 'paid') {
      const enCaisse = inv.payment_method === 'cash';
      journal.push({
        journal: enCaisse ? 'CA' : 'BQ',
        date: inv.paid_at || inv.created_at,
        piece,
        compte: enCaisse ? '571' : '521',
        libelle: enCaisse ? 'Caisse — encaissement espèces' : `Banque — règlement ${inv.payment_method || 'non précisé'}`,
        debit: total,
        credit: 0,
      });
      journal.push({
        journal: enCaisse ? 'CA' : 'BQ',
        date: inv.paid_at || inv.created_at,
        piece,
        compte: '411',
        libelle: `Solde créance — ${inv.patient_name}`,
        debit: 0,
        credit: total,
      });
    } else {
      // Part réellement demandée à une mutuelle : soit le total des demandes
      // de prise en charge en attente, soit la facture entière si elle a été
      // basculée « chez la mutuelle » sans demande détaillée.
      const partMutuelle = Math.min(
        Number(inv.part_mutuelle) || (inv.payment_method === 'insurance' ? total : 0),
        total
      );
      if (partMutuelle > 0) {
        journal.push({
          journal: 'OD',
          date: inv.created_at,
          piece,
          compte: '4116',
          libelle: `Transfert créance mutuelle — ${inv.patient_name}`,
          debit: partMutuelle,
          credit: 0,
        });
        journal.push({
          journal: 'OD',
          date: inv.created_at,
          piece,
          compte: '411',
          libelle: `Solde créance patient — ${inv.patient_name}`,
          debit: 0,
          credit: partMutuelle,
        });
      }
    }
  }

  journal.sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());

  return NextResponse.json({
    periode: { debut: start.toISOString(), fin: end.toISOString() },
    kpis: {
      encaissements: Number(k.encaissements),
      caisse: Number(k.caisse),
      banque: Number(k.banque),
      creancesPatients: Number(k.creances_patients),
      creancesMutuelles: Number(k.creances_mutuelles),
      chiffreAffaires: Number(k.chiffre_affaires),
      facturesImpayees: Number(k.factures_impayees),
    },
    journal: journal.slice(0, 400),
    nbFactures: invoiceRows.length,
    // Le tableau de bord annonçait « N facture(s) non soldée(s) » sans jamais
    // dire lesquelles : le comptable devait ouvrir les dossiers un par un
    // pour savoir qui devait de l'argent au cabinet.
    impayees: invoiceRows
      .filter((i: any) => i.status !== 'paid')
      .map((i: any) => {
        const total = Number(i.total);
        const partMutuelle = Math.min(
          Number(i.part_mutuelle) || (i.payment_method === 'insurance' ? total : 0),
          total
        );
        return {
          id: i.id,
          numero: i.invoice_number,
          patient: i.patient_name,
          total,
          // Détail indispensable : afficher le total comme « montant dû » par
          // le patient contredisait les créances patients du tableau de bord
          // dès qu'une prise en charge mutuelle était en cours.
          partMutuelle,
          duPatient: total - partMutuelle,
          statut: i.status,
          emiseLe: i.created_at,
        };
      }),
  });
}
