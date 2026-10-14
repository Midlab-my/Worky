-- Worky: schema do Painel RH (empresa)
-- Schema-base: depois verifique/aplique 20261013_security.sql para as RPCs privadas.
-- Cole este arquivo inteiro no SQL Editor do Supabase e rode Run.
-- Depois: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no frontend.
-- Contas empresa nascem pelo cadastro do app (tipo Empresa) ou Auth > Users + insert abaixo.
-- Checklist completo: Obsidian > 13_Handoff-Supabase-Painel-RH.md

create extension if not exists pgcrypto;

create table if not exists public.company_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  size text not null default '',
  cnpj text not null default '',
  location text not null default '',
  sector text not null default '',
  linkedin text not null default '',
  plan text not null default 'starter'
    check (plan in ('starter', 'pro', 'enterprise')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_company_profiles_plan
  on public.company_profiles (plan);

create or replace function public.set_company_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_company_profiles_updated_at on public.company_profiles;
create trigger trg_company_profiles_updated_at
before update on public.company_profiles
for each row
execute function public.set_company_profiles_updated_at();

alter table public.company_profiles enable row level security;

drop policy if exists "Companies can read own profile" on public.company_profiles;
create policy "Companies can read own profile"
on public.company_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Companies can insert own profile" on public.company_profiles;
create policy "Companies can insert own profile"
on public.company_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Companies can update own profile" on public.company_profiles;
create policy "Companies can update own profile"
on public.company_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Companies can delete own profile" on public.company_profiles;
create policy "Companies can delete own profile"
on public.company_profiles
for delete
to authenticated
using (auth.uid() = user_id);

revoke all on table public.company_profiles from anon;
revoke insert, update on public.company_profiles from authenticated;
grant select, delete on public.company_profiles to authenticated;
grant insert (user_id, company_name, size, cnpj, location, sector, linkedin) on public.company_profiles to authenticated;
grant update (company_name, size, cnpj, location, sector, linkedin) on public.company_profiles to authenticated;
grant select, insert, update, delete on table public.company_profiles to service_role;

create table if not exists public.company_jobs (
  id uuid primary key default gen_random_uuid(),
  company_user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  local text not null default '',
  modelo text not null default 'Remoto'
    check (modelo in ('Remoto', 'Híbrido', 'Presencial')),
  requisitos text not null default '',
  descricao text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_company_jobs_company_user_id
  on public.company_jobs (company_user_id);

create index if not exists idx_company_jobs_updated_at
  on public.company_jobs (updated_at desc);

create or replace function public.set_company_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_company_jobs_updated_at on public.company_jobs;
create trigger trg_company_jobs_updated_at
before update on public.company_jobs
for each row
execute function public.set_company_jobs_updated_at();

alter table public.company_jobs enable row level security;

drop policy if exists "Companies can read own jobs" on public.company_jobs;
create policy "Companies can read own jobs"
on public.company_jobs
for select
to authenticated
using (auth.uid() = company_user_id);

drop policy if exists "Companies can insert own jobs" on public.company_jobs;
create policy "Companies can insert own jobs"
on public.company_jobs
for insert
to authenticated
with check (auth.uid() = company_user_id);

drop policy if exists "Companies can update own jobs" on public.company_jobs;
create policy "Companies can update own jobs"
on public.company_jobs
for update
to authenticated
using (auth.uid() = company_user_id)
with check (auth.uid() = company_user_id);

drop policy if exists "Companies can delete own jobs" on public.company_jobs;
create policy "Companies can delete own jobs"
on public.company_jobs
for delete
to authenticated
using (auth.uid() = company_user_id);

revoke all on table public.company_jobs from anon;
grant select, insert, update, delete on table public.company_jobs to authenticated;
grant select, insert, update, delete on table public.company_jobs to service_role;

-- Recruitment access is authorized by the backend, never by broad profile SELECT.
drop policy if exists "Pro companies can read profiles for matching" on public.professional_profiles;
-- Cross-user raw profiles are never readable. Use the authorized recruitment endpoint.

-- Opcional: depois de criar um usuario em Authentication > Users,
-- rode (trocando o UUID) para marcar como empresa:
--
-- insert into public.company_profiles (user_id, company_name, plan)
-- values ('00000000-0000-0000-0000-000000000000', 'Tech Solutions Inc.', 'starter')
-- on conflict (user_id) do update
-- set company_name = excluded.company_name;

-- Keep base installs safe; apply 20261013_security.sql for private RPCs.
alter table public.professional_profiles add column if not exists recruitment_visible boolean not null default false;
create or replace function public.worky_guard_company_plan()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or auth.role() = 'service_role' then
    return new;
  end if;
  if (tg_op = 'INSERT' and new.plan <> 'starter') then
    raise exception 'Plan changes require server authorization' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and (new.plan is distinct from old.plan or new.user_id is distinct from old.user_id) then
    raise exception 'Plan changes require server authorization' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists worky_guard_company_plan on public.company_profiles;
create trigger worky_guard_company_plan before insert or update on public.company_profiles
  for each row execute function public.worky_guard_company_plan();
