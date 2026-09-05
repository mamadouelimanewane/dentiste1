-- Valeur de la lettre-clé D, paramétrable par convention.
--
-- Tous les prix du catalogue sont une cotation (D5, D10, D15…) multipliée par
-- la valeur de D, jusqu'ici figée à 1 200 F dans le code. Or cette valeur
-- dépend de la convention appliquée : le tarif du cabinet, celui d'une IPM,
-- celui d'un assureur. Une base erronée décale TOUS les devis et TOUTES les
-- factures, proportionnellement et sans que rien ne le signale.
--
-- Deux niveaux :
--   * clinic_settings.valeur_d — la base du cabinet, celle qui s'applique par
--     défaut, notamment aux patients sans mutuelle ;
--   * conventions — une base par organisme, que le cabinet saisit lui-même.

alter table clinic_settings
  add column if not exists valeur_d integer not null default 1200;

create table if not exists conventions (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  valeur_d integer not null,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Deux conventions ne peuvent pas porter le même nom : le praticien choisit
-- sa base dans une liste, un doublon rendrait ce choix ambigu.
create unique index if not exists idx_conventions_nom on conventions (lower(nom));

-- Base retenue au moment du devis, conservée avec lui.
--
-- Sans cette trace, rééditer un devis après un changement de convention le
-- recalculerait à une autre base que celle signée par le patient.
alter table quotes
  add column if not exists convention text,
  add column if not exists valeur_d integer;

comment on column clinic_settings.valeur_d is
  'Valeur de la lettre-clé D pour le tarif du cabinet (FCFA).';
comment on column conventions.valeur_d is
  'Valeur de la lettre-clé D propre à cet organisme (FCFA).';
comment on column quotes.valeur_d is
  'Base tarifaire effectivement appliquée à ce devis, figée à sa création.';
