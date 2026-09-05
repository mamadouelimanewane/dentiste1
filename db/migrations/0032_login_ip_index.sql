-- Plafond de tentatives par poste.
--
-- La limitation ne portait que sur l'adresse e-mail saisie : un balayage de
-- mots de passe sur plusieurs comptes n'était jamais freiné, il suffisait de
-- changer d'adresse tous les quatre essais. Le contrôle porte désormais aussi
-- sur l'IP d'origine, ce qui suppose de pouvoir la filtrer sans balayer toute
-- la table à chaque connexion.

create index if not exists login_attempts_ip_created_idx
  on login_attempts (ip, created_at desc)
  where success = false;

-- Le compteur par compte ne retient que les échecs postérieurs à la dernière
-- connexion réussie : il faut retrouver ce dernier succès à moindre coût.
create index if not exists login_attempts_email_success_idx
  on login_attempts (email, created_at desc)
  where success = true;
