-- Devis (remplace l'état 100% éphémère de QuoteBuilder : aucune sauvegarde,
-- perdu à la fermeture de l'onglet, patient toujours "Mamadou Diallo" en dur).

create type quote_status as enum ('draft', 'sent', 'accepted', 'rejected');

create table quotes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  practitioner_id uuid references users(id),
  items jsonb not null default '[]'::jsonb,
  total numeric(12, 0) not null default 0,
  status quote_status not null default 'draft',
  signed boolean not null default false,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index quotes_patient_idx on quotes (patient_id);
