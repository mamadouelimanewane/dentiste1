-- Rôles et profils utilisateurs liés à Supabase Auth.
-- Remplace le sélecteur de rôle client-side par une identité serveur réelle.

create type public.user_role as enum ('admin', 'praticien', 'accueil', 'comptable');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.user_role not null default 'accueil',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper SECURITY DEFINER : évite la récursion RLS quand une policy sur
-- `profiles` doit elle-même lire `profiles`. Réutilisé par toutes les
-- migrations suivantes pour appliquer le RBAC serveur.
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "profiles_update_admin_only"
  on public.profiles for update
  using (public.current_user_role() = 'admin');

-- Auto-création du profil à l'inscription (rôle par défaut 'accueil',
-- ajustable ensuite par un admin via /api/admin/users).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'accueil')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automatique
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
