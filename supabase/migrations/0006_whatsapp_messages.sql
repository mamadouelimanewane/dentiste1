-- Messages WhatsApp réels (entrants via webhook Meta, sortants via l'API
-- Cloud). Remplace le détournement de `neural_logs` filtré sur
-- command_type=WHATSAPP utilisé jusqu'ici par WhatsAppIntelligentHub.
-- Table livrée dès la Phase 2 pour grouper les migrations de schéma ;
-- le code applicatif (Phase 3) reste en mode simulation tant que
-- WHATSAPP_ACCESS_TOKEN n'est pas configuré.

create type public.whatsapp_direction as enum ('inbound', 'outbound');
create type public.whatsapp_status as enum ('simulated', 'sent', 'delivered', 'read', 'failed', 'received');

create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id),
  phone text not null,
  direction public.whatsapp_direction not null,
  body text not null,
  status public.whatsapp_status not null default 'simulated',
  provider_message_id text,
  sent_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index whatsapp_messages_patient_idx on public.whatsapp_messages (patient_id);
create index whatsapp_messages_created_at_idx on public.whatsapp_messages (created_at desc);

alter table public.whatsapp_messages enable row level security;

create policy "whatsapp_messages_select_staff"
  on public.whatsapp_messages for select using (auth.uid() is not null);

create policy "whatsapp_messages_insert_staff"
  on public.whatsapp_messages for insert with check (
    public.current_user_role() in ('accueil', 'praticien', 'admin')
  );
