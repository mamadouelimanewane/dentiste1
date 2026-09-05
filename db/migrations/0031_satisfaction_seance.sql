-- Note de satisfaction recueillie à la clôture de séance.
--
-- L'écran « Suivi & Archivage » affichait cinq étoiles, préréglées sur 5/5,
-- que le praticien pouvait modifier — et la valeur n'allait nulle part :
-- aucune colonne, aucun appel serveur, aucune exploitation. Le cabinet
-- croyait constituer un historique de satisfaction ; il ne restait rien.
--
-- Recueillir un avis pour le jeter est pire que ne pas le demander : la
-- note est donc rattachée au rendez-vous, avec la date de sa saisie.

alter table appointments
  add column if not exists satisfaction smallint,
  add column if not exists satisfaction_at timestamptz;

alter table appointments
  drop constraint if exists appointments_satisfaction_check;

alter table appointments
  add constraint appointments_satisfaction_check
  check (satisfaction is null or (satisfaction between 1 and 5));
