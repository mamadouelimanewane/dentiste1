-- Portail patient : authentification par lien magique (WhatsApp/SMS) et
-- partage de documents. La session portail est un cookie JWT signé côté
-- application (src/lib/portal-session.ts) : les patients n'ont pas de
-- compte `users`, ces tables sont donc accédées uniquement par les routes
-- API serveur qui vérifient elles-mêmes le cookie de session portail.

create table patient_portal_tokens (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index patient_portal_tokens_token_idx on patient_portal_tokens (token);

create table patient_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  uploaded_by_user uuid references users(id),
  uploaded_by_patient boolean not null default false,
  file_name text not null,
  blob_url text not null,
  mime_type text,
  size_bytes bigint,
  visible_to_patient boolean not null default true,
  created_at timestamptz not null default now()
);

create index patient_documents_patient_idx on patient_documents (patient_id);
