create table clinical_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade not null,
  content text not null,
  type text not null default 'general', -- 'general', 'prescription', 'surgery'
  created_by uuid references users(id) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clinical_notes_patient_idx on clinical_notes(patient_id);
