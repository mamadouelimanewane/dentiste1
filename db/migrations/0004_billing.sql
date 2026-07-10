-- Facturation et actes exécutés (remplace localStorage["dentiste_lite_executed_acts"]).

create type invoice_status as enum ('draft', 'pending', 'paid', 'cancelled');

create sequence invoice_number_seq start 1000;

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default
    ('FAC-' || extract(year from now())::text || '-' || nextval('invoice_number_seq')::text),
  patient_id uuid not null references patients(id),
  total numeric(12, 0) not null default 0,
  status invoice_status not null default 'draft',
  payment_method text,
  payment_provider text,
  payment_reference text,
  paid_at timestamptz,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table executed_acts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  appointment_id uuid references appointments(id),
  invoice_id uuid references invoices(id),
  code text,
  label text not null,
  tooth int,
  price numeric(12, 0) not null default 0,
  performed_by uuid references users(id),
  performed_at timestamptz not null default now()
);

create index invoices_patient_idx on invoices (patient_id);
create index executed_acts_patient_idx on executed_acts (patient_id);
create index executed_acts_invoice_idx on executed_acts (invoice_id);
