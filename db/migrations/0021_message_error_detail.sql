-- Motif d'échec d'un message (code + libellé renvoyés par le fournisseur).
-- Un rappel non distribué n'apprenait rien au cabinet : le statut passait à
-- "failed" sans dire pourquoi (numéro invalide, hors fenêtre 24h, modèle non
-- approuvé...), alors que la conduite à tenir diffère complètement.
alter table patient_messages add column if not exists error_detail text;
