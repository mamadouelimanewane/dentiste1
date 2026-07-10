-- Salle d'attente (check-in) et rendez-vous récurrents.

alter table appointments add column checked_in_at timestamptz;
alter table appointments add column recurrence_group_id uuid;

create index appointments_recurrence_group_idx on appointments (recurrence_group_id);
create index appointments_practitioner_scheduled_idx on appointments (practitioner_id, scheduled_at);
