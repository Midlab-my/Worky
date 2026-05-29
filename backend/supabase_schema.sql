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
