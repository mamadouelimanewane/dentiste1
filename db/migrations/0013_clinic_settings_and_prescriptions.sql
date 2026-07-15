-- Paramètres du cabinet (singleton — une seule ligne, id=true forcé par le
-- CHECK) : remplace le formulaire "Configuration" qui ne persistait rien
-- (juste un état local remis à zéro après 3s).
create table clinic_settings (
  id boolean primary key default true check (id),
  clinic_name text not null default 'CABINET DENTAIRE DU CAP VERT',
  slogan text,
  phone text,
  email text,
  website text,
  address text,
  rpps text,
  ninea text,
  rccm text,
  currency text not null default 'FCFA',
  updated_by uuid references users(id),
  updated_at timestamptz not null default now()
);

insert into clinic_settings (id) values (true);

-- Ordonnances réelles (remplace le module "Ordonnances" dont le bouton
-- Sauvegarder n'avait aucun handler et dont le sélecteur de patient était
-- une liste de faux noms codés en dur).
create table prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  practitioner_id uuid references users(id),
  medications jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index prescriptions_patient_idx on prescriptions (patient_id);
