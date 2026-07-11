-- Rôles personnalisés et privilèges granulaires (module + vue/gestion),
-- remplaçant les 4 rôles fixes en dur dans le code par des rôles stockés
-- en base, créables/modifiables/supprimables depuis l'admin.

create table roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  is_system boolean not null default false,
  is_practitioner boolean not null default false,
  manage_roles boolean not null default false,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- permissions: { "<moduleId>": { "view": bool, "manage": bool } }

insert into roles (slug, label, is_system, is_practitioner, manage_roles, permissions) values
('admin', 'Administrateur', true, false, true, '{
  "1":{"view":true,"manage":true},"2":{"view":true,"manage":true},"3":{"view":true,"manage":true},
  "4":{"view":true,"manage":true},"5":{"view":true,"manage":true},"6":{"view":true,"manage":true},
  "7":{"view":true,"manage":true},"8":{"view":true,"manage":true},"9":{"view":true,"manage":true},
  "10":{"view":true,"manage":true},"11":{"view":true,"manage":true},"12":{"view":true,"manage":true},
  "13":{"view":true,"manage":true},"14":{"view":true,"manage":true},"15":{"view":true,"manage":true},
  "16":{"view":true,"manage":true},"17":{"view":true,"manage":true},"18":{"view":true,"manage":true},
  "19":{"view":true,"manage":true},"20":{"view":true,"manage":true},"21":{"view":true,"manage":true},
  "22":{"view":true,"manage":true},"23":{"view":true,"manage":true},"24":{"view":true,"manage":true}
}'::jsonb),
('praticien', 'Praticien', true, true, false, '{
  "2":{"view":true,"manage":true},"3":{"view":true,"manage":true},"4":{"view":true,"manage":true},
  "5":{"view":true,"manage":true},"6":{"view":true,"manage":true},"9":{"view":true,"manage":true},
  "10":{"view":true,"manage":false},"11":{"view":true,"manage":true},"12":{"view":true,"manage":true},
  "13":{"view":true,"manage":true},"14":{"view":true,"manage":true},"15":{"view":true,"manage":true},
  "16":{"view":true,"manage":true},"17":{"view":true,"manage":true},"18":{"view":true,"manage":true},
  "19":{"view":true,"manage":true},"20":{"view":true,"manage":true}
}'::jsonb),
('accueil', 'Accueil', true, false, false, '{
  "1":{"view":true,"manage":true},"2":{"view":true,"manage":true},"5":{"view":true,"manage":false},
  "6":{"view":true,"manage":true},"7":{"view":true,"manage":true},"9":{"view":false,"manage":true},
  "11":{"view":true,"manage":true},"13":{"view":true,"manage":true},"16":{"view":true,"manage":true},
  "17":{"view":true,"manage":true},"18":{"view":true,"manage":true},"19":{"view":true,"manage":true},
  "20":{"view":true,"manage":true}
}'::jsonb),
('comptable', 'Comptable', true, false, false, '{
  "5":{"view":true,"manage":false},"6":{"view":true,"manage":true},"7":{"view":true,"manage":true},
  "8":{"view":true,"manage":true},"9":{"view":false,"manage":true},"13":{"view":true,"manage":false},
  "20":{"view":true,"manage":false}
}'::jsonb);

alter table users add column role_id uuid references roles(id);

update users u set role_id = r.id from roles r where r.slug = u.role::text;

alter table users alter column role_id set not null;

alter table users drop column role;

drop type user_role;

create index users_role_id_idx on users (role_id);
