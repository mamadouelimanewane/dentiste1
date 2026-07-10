-- Dossiers patients réels (remplace le localStorage mono-patient).

create sequence public.patient_dossier_seq start 10000;

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  dossier_number text not null unique default
    ('SN-' || nextval('public.patient_dossier_seq')::text || '-X'),
  full_name text not null,
  birth_date date,
  phone text,
  address text,
  national_id text,
  status text not null default 'active',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patients_full_name_idx on public.patients using gin (to_tsvector('french', full_name));
create index patients_phone_idx on public.patients (phone);

alter table public.patients enable row level security;

create policy "patients_select_all_staff"
  on public.patients for select using (auth.uid() is not null);

create policy "patients_insert_front_praticien_admin"
  on public.patients for insert with check (
    public.current_user_role() in ('accueil', 'praticien', 'admin')
  );

create policy "patients_update_front_praticien_admin"
  on public.patients for update using (
    public.current_user_role() in ('accueil', 'praticien', 'admin')
  );

create trigger patients_set_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();
