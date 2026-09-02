-- Historique de connexion exploitable par utilisateur.
--
-- `login_attempts` ne servait qu'au rate-limiting : elle ne retenait que
-- l'email saisi, sans lien avec le compte, sans indication du poste utilisé,
-- et le cron de nettoyage purgeait tout au bout de 30 jours. Impossible donc
-- de répondre à « quand ce compte s'est-il connecté, et depuis où ? », qui
-- est une question courante dans un cabinet partageant plusieurs postes.
alter table login_attempts add column if not exists user_id uuid references users(id) on delete set null;
alter table login_attempts add column if not exists user_agent text;

-- Rattache l'historique existant aux comptes correspondants.
update login_attempts la
set user_id = u.id
from users u
where la.user_id is null and lower(la.email) = lower(u.email);

create index if not exists login_attempts_user_id_idx on login_attempts (user_id, created_at desc);
