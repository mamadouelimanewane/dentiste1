-- Rendez-vous / agenda. Colonnes daily_room_* anticipées pour la Phase 4
-- (téléconsultation Daily.co) afin d'éviter une migration supplémentaire triviale.

create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  practitioner_id uuid references public.profiles(id),
  scheduled_at timestamptz not null,
  duration_minutes int not null default 30,
  type text,
  status public.appointment_status not null default 'scheduled',
  daily_room_name text,
  daily_room_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index appointments_patient_idx on public.appointments (patient_id);
create index appointments_scheduled_at_idx on public.appointments (scheduled_at);

alter table public.appointments enable row level security;

create policy "appointments_select_staff"
  on public.appointments for select using (auth.uid() is not null);

create policy "appointments_insert_staff"
  on public.appointments for insert with check (
    public.current_user_role() in ('accueil', 'praticien', 'admin')
  );

create policy "appointments_update_staff"
  on public.appointments for update using (
    public.current_user_role() in ('accueil', 'praticien', 'admin')
  );
