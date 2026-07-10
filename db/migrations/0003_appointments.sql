-- Rendez-vous / agenda. Colonnes daily_room_* anticipées pour la Phase 4
-- (téléconsultation Daily.co) afin d'éviter une migration supplémentaire triviale.

create type appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');

create table appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  practitioner_id uuid references users(id),
  scheduled_at timestamptz not null,
  duration_minutes int not null default 30,
  type text,
  status appointment_status not null default 'scheduled',
  daily_room_name text,
  daily_room_url text,
  notes text,
  reminder_sent_at timestamptz,
  follow_up_sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index appointments_patient_idx on appointments (patient_id);
create index appointments_scheduled_at_idx on appointments (scheduled_at);
