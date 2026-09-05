-- Statut « à envoyer » pour les messages programmés.
--
-- La tâche de nuit envoyait les messages programmés par un canal unique, sans
-- repli ni file manuelle : un envoi qui échouait passait en « failed » et
-- personne ne le reprenait. Or aucun canal automatique n'est configuré dans ce
-- cabinet — WhatsApp attend la vérification Meta, Orange SMS son approbation :
-- TOUS les messages programmés mouraient donc ainsi chaque nuit. L'assistante
-- voyait « N envois programmés » le soir, et le patient n'était jamais
-- contacté.
--
-- Ils passent désormais par le même chemin que les rappels de rendez-vous, qui
-- dépose dans la file d'envoi manuel. Ce statut distingue « en attente d'une
-- main humaine » de « perdu ».

alter type scheduled_message_status add value if not exists 'a_envoyer';
