-- Explications de plan de traitement destinées au patient.
--
-- Le praticien décide des soins ; cette table conserve la reformulation en
-- langage courant qui lui a été proposée, dans les deux langues, avec les
-- données exactes qui ont servi à la produire.
--
-- Conserver `source` n'est pas décoratif : c'est ce qui permet de vérifier
-- après coup qu'aucun montant ni aucun acte n'a été inventé par le modèle.
-- Sans cette trace, on ne pourrait pas distinguer une reformulation fidèle
-- d'une hallucination.
create table if not exists patient_explanations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  quote_id uuid references quotes(id) on delete set null,

  -- Actes et montants réellement transmis au modèle, tels que lus en base.
  source jsonb not null,

  texte_fr text not null,
  texte_wo text,

  -- Modèle utilisé : une reformulation reste attribuable à sa version.
  modele text not null,

  -- Le praticien relit avant tout envoi ; tant que ce champ est nul, le
  -- texte n'a pas été validé et ne doit pas partir au patient.
  valide_par uuid references users(id) on delete set null,
  valide_le timestamptz,

  envoye_le timestamptz,

  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists patient_explanations_patient_idx
  on patient_explanations (patient_id, created_at desc);
