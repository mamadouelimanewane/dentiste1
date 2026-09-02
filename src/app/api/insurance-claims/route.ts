import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validerMontant, bornerTexte } from '@/lib/validation';
import { requirePermission } from '@/lib/permissions';

export async function GET() {
  // Lecture : 'view' comme partout ailleurs (lab-orders, prescriptions,
  // inventory...). 'manage' implique 'view', donc aucun rôle ne perd l'accès.
  const { error, status } = await requirePermission(9, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const claims = await sql`
    select ic.*, p.full_name as patient_name
    from insurance_claims ic
    join patients p on p.id = ic.patient_id
    order by ic.created_at desc
    limit 100
  `;

  return NextResponse.json({ claims });
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
