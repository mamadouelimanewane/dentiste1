-- Repli SMS après échec asynchrone d'un envoi WhatsApp.
--
-- Meta accepte la requête puis rejette la livraison : l'échec n'arrive que
-- plus tard, par webhook. Le repli synchrone de notifyPatient ne pouvait donc
-- pas se déclencher, et le message de bienvenue comme la confirmation de
-- rendez-vous n'atteignaient jamais un nouveau patient — celui-ci n'ayant par
-- définition jamais écrit au cabinet, il est toujours hors de la fenêtre de
-- 24h que Meta impose au texte libre.
--
-- Cette colonne relie le SMS de repli au message WhatsApp qu'il remplace :
-- elle sert à retrouver l'historique, et surtout à ne jamais réessayer deux
-- fois le même message.
alter table patient_messages add column if not exists fallback_of uuid references patient_messages(id) on delete set null;

create index if not exists patient_messages_fallback_idx on patient_messages (fallback_of);
