-- Archivage des notes cliniques.
--
-- Constaté en jouant un parcours complet : l'API permettait de réécrire
-- (PATCH) et d'effacer (DELETE) une note clinique sans laisser la moindre
-- trace — le contenu antérieur disparaissait de la base. Dans un dossier
-- médical, une note ne s'efface pas : elle se rectifie, l'antérieur restant
-- consultable. En cas de litige (« la grossesse était-elle notée avant
-- l'acte ? »), l'application ne pouvait rien produire.
--
-- La suppression devient donc un archivage : la ligne reste, marquée de sa
-- date et de son auteur, et sort simplement des listes.

alter table clinical_notes
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references users(id);

-- Les listes filtrent sur deleted_at is null : l'index évite un balayage
-- du dossier à chaque ouverture de fiche.
create index if not exists clinical_notes_patient_actives_idx
  on clinical_notes (patient_id, created_at desc)
  where deleted_at is null;
