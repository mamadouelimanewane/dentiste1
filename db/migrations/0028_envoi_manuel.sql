-- Envoi manuel des messages patients.
--
-- Aucun fournisseur d'envoi automatique n'est ouvert au cabinet : Twilio et
-- Africa's Talking exigent une vérification d'identité que le cabinet n'a pas
-- pu franchir, et le compte WhatsApp Business de Meta reste bloqué faute de
-- moyen de paiement accepté. Attendre l'un des trois reviendrait à repousser
-- la mise en service.
--
-- L'assistante peut envoyer elle-même, depuis le téléphone du cabinet : le
-- logiciel prépare le texte et ouvre WhatsApp dessus, elle appuie sur envoyer.
-- Le message part donc réellement, mais par une main humaine.
--
-- D'où le statut 'a_envoyer' : préparé, remis à l'assistante, PAS encore
-- parti. Le confondre avec 'sent' ferait croire au cabinet que le patient a
-- été prévenu alors que personne n'a encore appuyé sur envoyer — c'est
-- exactement le mensonge que ce statut existe pour empêcher. Il ne devient
-- 'sent' que lorsqu'une personne le confirme, et `envoi_manuel` garde la
-- trace que la livraison n'a jamais été constatée par un fournisseur.

alter type message_status add value if not exists 'a_envoyer';

alter table patient_messages
  add column if not exists envoi_manuel boolean not null default false;

-- Retrouver rapidement ce qui attend l'assistante.
create index if not exists idx_patient_messages_a_envoyer
  on patient_messages (status)
  where envoi_manuel = true;
