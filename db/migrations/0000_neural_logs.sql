-- Journal des commandes détectées par l'assistant IA (NeuralAssistant).
-- Existait auparavant directement dans le dashboard Supabase sans être
-- versionné ; recréé ici pour la base Neon.

create table neural_logs (
  id uuid primary key default gen_random_uuid(),
  command_id text,
  command_type text not null,
  content text not null,
  suggestion text,
  status text not null default 'pending',
  meta_data jsonb,
  created_at timestamptz not null default now()
);

create index neural_logs_created_at_idx on neural_logs (created_at desc);
create index neural_logs_command_type_idx on neural_logs (command_type);
