create extension if not exists pgcrypto;

create table if not exists public.career_analyses (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  cargo text not null,
  filtros_json jsonb not null default '{}'::jsonb,
  vagas_json jsonb not null default '[]'::jsonb,
  analysis_json jsonb not null default '{}'::jsonb,
  scrape_file_path text,
  schema_version integer not null default 2,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_career_analyses_cargo on public.career_analyses (cargo);
create index if not exists idx_career_analyses_updated_at on public.career_analyses (updated_at desc);
create index if not exists idx_career_analyses_schema_version on public.career_analyses (schema_version);

create or replace function public.set_career_analyses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_career_analyses_updated_at on public.career_analyses;

create trigger trg_career_analyses_updated_at
before update on public.career_analyses
for each row
execute function public.set_career_analyses_updated_at();

alter table public.career_analyses enable row level security;

revoke all on table public.career_analyses from anon, authenticated;
grant select, insert, update, delete on table public.career_analyses to service_role;

create table if not exists public.professional_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_json jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_professional_profiles_updated_at on public.professional_profiles (updated_at desc);
create index if not exists idx_professional_profiles_completed_at on public.professional_profiles (completed_at desc);

create or replace function public.set_professional_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_professional_profiles_updated_at on public.professional_profiles;

create trigger trg_professional_profiles_updated_at
before update on public.professional_profiles
for each row
execute function public.set_professional_profiles_updated_at();

alter table public.professional_profiles enable row level security;

drop policy if exists "Users can read their own professional profile" on public.professional_profiles;
create policy "Users can read their own professional profile"
on public.professional_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own professional profile" on public.professional_profiles;
create policy "Users can insert their own professional profile"
on public.professional_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own professional profile" on public.professional_profiles;
create policy "Users can update their own professional profile"
on public.professional_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own professional profile" on public.professional_profiles;
create policy "Users can delete their own professional profile"
on public.professional_profiles
for delete
to authenticated
using (auth.uid() = user_id);

revoke all on table public.professional_profiles from anon;
grant select, insert, update, delete on table public.professional_profiles to authenticated;
grant select, insert, update, delete on table public.professional_profiles to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view profile avatars" on storage.objects;
create policy "Public can view profile avatars"
on storage.objects
for select
to public
using (bucket_id = 'profile-avatars');

drop policy if exists "Authenticated users can upload own profile avatar" on storage.objects;
create policy "Authenticated users can upload own profile avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Authenticated users can update own profile avatar" on storage.objects;
create policy "Authenticated users can update own profile avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Catálogo de cursos raspados (Alura, FGV) com TTL de 30 dias
create table if not exists public.course_catalog (
  id uuid primary key default gen_random_uuid(),
  query_key text not null,
  plataforma text not null,
  nome text not null,
  url text not null default '',
  area text not null default '',
  motivo text not null default '',
  preco text not null default '',
  scraped_at timestamptz not null default timezone('utc', now()),
  unique (query_key, plataforma, nome)
);

create index if not exists idx_course_catalog_query_key on public.course_catalog (query_key);
create index if not exists idx_course_catalog_scraped_at on public.course_catalog (scraped_at desc);

alter table public.course_catalog enable row level security;
revoke all on table public.course_catalog from anon, authenticated;
grant select, insert, update, delete on table public.course_catalog to service_role;


-- Painel RH: ver tambem backend/supabase_company_rh.sql (script completo para colar no SQL Editor)
-- Worky: schema do Painel RH (empresa)
-- Cole este arquivo inteiro no SQL Editor do Supabase e rode Run.
-- Depois: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no frontend.
-- Contas empresa nascem pelo cadastro do app (tipo Empresa) ou Auth > Users + insert abaixo.

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
