-- Comptes staff et rôles. Sur Neon (Postgres brut, sans service Auth), les
-- comptes et mots de passe sont gérés directement par l'application
-- (src/lib/auth.ts, bcrypt + session JWT signée) plutôt que par un service
-- d'auth managé. La sécurité par rôle est donc appliquée côté code
-- (src/lib/require-role.ts) dans chaque route API / server component,
-- pas via des policies RLS Postgres.

create type user_role as enum ('admin', 'praticien', 'accueil', 'comptable');

create table users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role user_role not null default 'accueil',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
