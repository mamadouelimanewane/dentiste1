-- Passage de l'agrégateur CinetPay à deux intégrations directes :
-- Wave et Orange Money, les deux moyens de paiement réellement utilisés au
-- Sénégal.
--
-- Orange Money renvoie à la création un `notif_token` que sa notification
-- serveur-à-serveur rappelle : c'est lui qui authentifie la notification.
-- Sans le conserver, on ne pourrait pas distinguer une vraie notification
-- d'un appel forgé.
alter table invoices add column if not exists payment_notif_token text;

-- Session de paiement en cours (identifiant côté fournisseur), pour pouvoir
-- réinterroger le statut sans dépendre du seul contenu de la notification.
alter table invoices add column if not exists payment_session_id text;

create index if not exists invoices_payment_session_idx on invoices (payment_session_id);
