-- Dossiers patients réels (remplace le localStorage mono-patient).

create sequence patient_dossier_seq start 10000;

create table patients (
  id uuid primary key default gen_random_uuid(),
  dossier_number text not null unique default
    ('SN-' || nextval('patient_dossier_seq')::text || '-X'),
  full_name text not null,
  birth_date date,
  phone text,
  address text,
  national_id text,
  status text not null default 'active',
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patients_full_name_idx on patients using gin (to_tsvector('french', full_name));
create index patients_phone_idx on patients (phone);
