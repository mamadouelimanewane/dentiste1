-- Mutuelles/assurances (montant numérique — corrige le bug "45,000 F" en
-- string du mock actuel) et piste d'audit réelle.

create type insurance_claim_status as enum ('pending', 'submitted', 'approved', 'rejected', 'paid');

create table insurance_claims (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  invoice_id uuid references invoices(id),
  provider text not null,
  policy_number text,
  claim_type text,
  amount numeric(12, 0) not null default 0,
  status insurance_claim_status not null default 'pending',
  submitted_at timestamptz,
  resolved_at timestamptz,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index insurance_claims_patient_idx on insurance_claims (patient_id);

-- Journal d'audit : chaque mutation clé (création patient, acte exécuté,
-- facture payée, changement de rôle...) y insère une ligne via
-- src/lib/audit.ts. Lecture réservée aux admins (vérifié côté code).
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on audit_logs (created_at desc);
