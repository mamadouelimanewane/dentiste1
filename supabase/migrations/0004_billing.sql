-- Facturation et actes exécutés (remplace localStorage["dentiste_lite_executed_acts"]).

create type public.invoice_status as enum ('draft', 'pending', 'paid', 'cancelled');

create sequence public.invoice_number_seq start 1000;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default
    ('FAC-' || extract(year from now())::text || '-' || nextval('public.invoice_number_seq')::text),
  patient_id uuid not null references public.patients(id),
  total numeric(12, 0) not null default 0,
  status public.invoice_status not null default 'draft',
  payment_method text,
  payment_provider text,
  payment_reference text,
  paid_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.executed_acts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id),
  invoice_id uuid references public.invoices(id),
  code text,
  label text not null,
  tooth int,
  price numeric(12, 0) not null default 0,
  performed_by uuid references public.profiles(id),
  performed_at timestamptz not null default now()
);

create index invoices_patient_idx on public.invoices (patient_id);
create index executed_acts_patient_idx on public.executed_acts (patient_id);
create index executed_acts_invoice_idx on public.executed_acts (invoice_id);

alter table public.invoices enable row level security;
alter table public.executed_acts enable row level security;

create policy "invoices_select_staff" on public.invoices for select using (auth.uid() is not null);
create policy "invoices_insert_staff" on public.invoices for insert with check (
  public.current_user_role() in ('praticien', 'comptable', 'admin')
);
create policy "invoices_update_staff" on public.invoices for update using (
  public.current_user_role() in ('comptable', 'admin')
);

create policy "acts_select_staff" on public.executed_acts for select using (auth.uid() is not null);
create policy "acts_insert_staff" on public.executed_acts for insert with check (
  public.current_user_role() in ('praticien', 'admin')
);
create policy "acts_update_staff" on public.executed_acts for update using (
  public.current_user_role() in ('praticien', 'comptable', 'admin')
);
