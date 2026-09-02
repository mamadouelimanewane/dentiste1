-- État « à envoyer » pour les ordres de laboratoire.
--
-- L'énumération ne comportait que production -> shipped -> completed, avec
-- 'production' par défaut : un ordre était donc affiché « en production »
-- dès sa saisie, avant toute transmission au laboratoire, et rien ne
-- permettait de repérer les travaux restant à envoyer. Une prothèse oubliée
-- entre le cabinet et le laboratoire est un incident courant.
--
-- Les ordres existants conservent leur statut : seul le défaut change.
alter type lab_order_status add value if not exists 'a_envoyer' before 'production';
