-- File d'attente pour les messages programmés (bouton "Programmer" du hub
-- de communication) et pour les rappels automatiques générés par le cron
-- /api/cron/reminders (rappel RDV 24h avant, suivi post-opératoire).

create type scheduled_message_status as enum ('pending', 'sent', 'failed', 'cancelled');

create table scheduled_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id),
  phone text not null,
  channel message_channel not null default 'whatsapp',
  body text not null,
  send_at timestamptz not null,
  status scheduled_message_status not null default 'pending',
  source text not null default 'manual',
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index scheduled_messages_send_at_idx on scheduled_messages (send_at) where status = 'pending';
