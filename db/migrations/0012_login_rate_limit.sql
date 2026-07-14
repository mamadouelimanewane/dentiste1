-- Journal des tentatives de connexion staff, utilisé pour limiter le
-- brute-force sur /login (voir src/app/login/actions.ts).
create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip text,
  success boolean not null default false,
  created_at timestamptz not null default now()
);

create index login_attempts_email_created_idx on login_attempts (email, created_at desc);
