-- Messagerie patient réelle (WhatsApp + SMS + portail), entrants via
-- webhook Meta, sortants via l'API Cloud WhatsApp ou Twilio SMS. Remplace
-- le détournement de `neural_logs` filtré sur command_type=WHATSAPP utilisé
-- jusqu'ici par WhatsAppIntelligentHub.

create type message_channel as enum ('whatsapp', 'sms', 'portal');
create type message_direction as enum ('inbound', 'outbound');
create type message_status as enum ('simulated', 'sent', 'delivered', 'read', 'failed', 'received');

create table patient_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id),
  phone text,
  channel message_channel not null default 'whatsapp',
  direction message_direction not null,
  body text not null,
  status message_status not null default 'simulated',
  provider_message_id text,
  sent_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index patient_messages_patient_idx on patient_messages (patient_id);
create index patient_messages_created_at_idx on patient_messages (created_at desc);
