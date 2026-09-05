import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validerMontant, bornerTexte } from '@/lib/validation';
import { requirePermission } from '@/lib/permissions';

export async function GET() {
  // Lecture : 'view' comme partout ailleurs (lab-orders, prescriptions,
  // inventory...). 'manage' implique 'view', donc aucun rôle ne perd l'accès.
  const { error, status } = await requirePermission(9, 'view');
  if (error) return NextResponse.json({ error }, { status });

  // Cette liste est une FILE DE TRAVAIL, pas un historique. Triée par date
  // décroissante et plafonnée à 100, elle faisait disparaître en premier les
  // demandes les plus anciennes — c'est-à-dire précisément celles qu'il faut
  // relancer. Les dossiers non soldés remontent donc en tête, quel que soit
  // leur âge, et l'écran sait ce qu'il ne montre pas.
  const LIMITE = 200;

  // `facture_soldee` : la facture rattachée a déjà été encaissée en totalité
  // alors que la demande court toujours. Le règlement au comptoir refuse
  // désormais ce cas (voir invoices/[id]/settle), mais un paiement mobile
  // money confirmé par webhook solde la facture sans passer par là — l'argent
  // est arrivé, on ne peut que le signaler. Sans ce drapeau, le cabinet
  // relançait l'assureur pour une somme déjà perçue.
  const claims = await sql`
    select ic.*, p.full_name as patient_name,
           (i.status = 'paid') as facture_soldee,
           i.invoice_number
    from insurance_claims ic
    join patients p on p.id = ic.patient_id
    left join invoices i on i.id = ic.invoice_id
    order by
      case ic.status
        when 'pending' then 0
        when 'submitted' then 1
        when 'approved' then 2
        when 'rejected' then 3
        else 4
      end,
      ic.created_at asc
    limit ${LIMITE}
  `;

  const compte = await sql`select count(*)::int as n from insurance_claims`;
  const total = Number(compte[0]?.n ?? claims.length);

  return NextResponse.json({ claims, total, tronque: total > claims.length });
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(9, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId, provider, policyNumber, claimType, amount, invoiceId } = body as {
    patientId?: string;
    provider?: string;
    policyNumber?: string;
    claimType?: string;
    amount?: number;
    invoiceId?: string;
  };

  if (!patientId || !provider || !amount) {
    return NextResponse.json({ error: 'patientId, provider et amount sont requis.' }, { status: 400 });
  }

  // Un montant négatif corrompait directement les créances mutuelles.
  const montant = validerMontant(amount, { obligatoire: false });
  if (!montant.ok) return NextResponse.json({ error: montant.erreur }, { status: 400 });

  const organisme = bornerTexte(provider, 150);
  if (!organisme) {
    return NextResponse.json({ error: "Le nom de l'organisme est requis." }, { status: 400 });
  }

  const rows = await sql`
    insert into insurance_claims (patient_id, invoice_id, provider, policy_number, claim_type, amount, created_by)
    values (${patientId}, ${invoiceId || null}, ${organisme}, ${bornerTexte(policyNumber, 60)}, ${bornerTexte(claimType, 60)}, ${montant.valeur}, ${session!.userId})
    returning *
  `;

  return NextResponse.json({ claim: rows[0] });
}

const STATUTS = ['pending', 'submitted', 'approved', 'rejected', 'paid'] as const;
type Statut = (typeof STATUTS)[number];

// Faire évoluer une demande de prise en charge.
//
// Seules la création et la lecture existaient : une demande restait
// indéfiniment « en attente », `resolved_at` n'était jamais renseignée et les
// créances mutuelles ne pouvaient que croître. L'écran affichait par ailleurs
// un « taux d'acceptation » et un « total remboursé » qui ne pouvaient
// structurellement jamais dépasser zéro, faute de statut atteignable.
export async function PATCH(request: Request) {
  const { session, error, status } = await requirePermission(9, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { id, status: nouveauStatut } = body as { id?: string; status?: Statut };

  if (!id || !nouveauStatut) {
    return NextResponse.json({ error: 'id et status sont requis.' }, { status: 400 });
  }
  if (!STATUTS.includes(nouveauStatut)) {
    return NextResponse.json(
      { error: `Statut invalide. Valeurs acceptées : ${STATUTS.join(', ')}.` },
      { status: 400 }
    );
  }

  // Une demande soldée (payée ou refusée) porte sa date de résolution ; les
  // statuts intermédiaires la remettent à null si l'on revient en arrière.
  const resolue = nouveauStatut === 'paid' || nouveauStatut === 'rejected';

  const rows = await sql`
    update insurance_claims
    set status = ${nouveauStatut},
        submitted_at = coalesce(submitted_at, case when ${nouveauStatut} <> 'pending' then now() end),
        resolved_at = case when ${resolue} then now() else null end
    where id = ${id}
    returning *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ claim: rows[0] });
}
