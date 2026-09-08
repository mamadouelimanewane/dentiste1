-- Mode démonstration.
--
-- Le cabinet a besoin de montrer l'application avec des documents complets —
-- une facture sans mentions légales ne ressemble pas à une facture. Mais
-- remplir NINEA, RCCM et adresse avec des valeurs inventées reproduirait
-- exactement le défaut corrigé partout ailleurs : un faux numéro fiscal sur un
-- document qui sort du cabinet.
--
-- Ce drapeau tranche : tant qu'il est levé, les factures, devis et ordonnances
-- portent la mention « Document de démonstration — sans valeur ». Les
-- coordonnées peuvent alors être remplies pour la présentation sans risque
-- qu'un document serve de pièce réelle.
--
-- Il se baisse depuis Configuration, le jour de l'ouverture, quand les vraies
-- mentions sont saisies. C'est un geste conscient, pas un oubli possible.

alter table clinic_settings
  add column if not exists mode_demo boolean not null default false;
