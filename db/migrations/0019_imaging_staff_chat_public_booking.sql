-- Trois tables pour remplacer les dernières données fictives de l'app :
--   * patient_images   : imagerie réelle (PatientImaging.tsx affichait des
--                        photos Unsplash génériques pour tous les patients)
--   * staff_messages   : chat interne réel (StaffChatWidget.tsx avait une
--                        conversation inventée, messages perdus au reload)
--   * public_booking_attempts : anti-abus de la prise de RDV publique
--                        (/api/public/appointments, ouverte aux anonymes)

create table patient_images (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  blob_url text not null,
  type text not null default 'Intra-orale',
  notes text,
  mime_type text,
  size_bytes int,
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index patient_images_patient_idx on patient_images (patient_id, created_at desc);

create table staff_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index staff_messages_created_at_idx on staff_messages (created_at desc);

-- Journal des réservations publiques par IP, sur le modèle de login_attempts
-- (migration 0012) : la prise de RDV en ligne est anonyme, donc sans garde-fou
-- n'importe qui pourrait créer des milliers de faux patients/rendez-vous.
create table public_booking_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text,
  phone text,
  created_at timestamptz not null default now()
);

create index public_booking_attempts_ip_created_idx on public_booking_attempts (ip, created_at desc);
