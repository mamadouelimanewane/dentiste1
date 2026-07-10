-- Mutuelles/assurances (montant numérique — corrige le bug "45,000 F" en
-- string du mock actuel) et piste d'audit réelle.

create type public.insurance_claim_status as enum ('pending', 'submitted', 'approved', 'rejected', 'paid');

create table public.insurance_claims (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  invoice_id uuid references public.invoices(id),
  provider text not null,
  policy_number text,
  claim_type text,
  amount numeric(12, 0) not null default 0,
  status public.insurance_claim_status not null default 'pending',
  submitted_at timestamptz,
  resolved_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index insurance_claims_patient_idx on public.insurance_claims (patient_id);

alter table public.insurance_claims enable row level security;

create policy "insurance_claims_select_staff"
  on public.insurance_claims for select using (auth.uid() is not null);

create policy "insurance_claims_insert_staff"
  on public.insurance_claims for insert with check (
    public.current_user_role() in ('accueil', 'praticien', 'comptable', 'admin')
  );

create policy "insurance_claims_update_staff"
  on public.insurance_claims for update using (
    public.current_user_role() in ('comptable', 'admin')
  );

-- Journal d'audit : chaque mutation clé (création patient, acte exécuté,
-- facture payée, changement de rôle...) y insère une ligne via
-- src/lib/audit.ts. Lecture réservée aux admins.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

create policy "audit_logs_insert_own"
  on public.audit_logs for insert with check (actor_id = auth.uid());

create policy "audit_logs_select_admin"
  on public.audit_logs for select using (public.current_user_role() = 'admin');
