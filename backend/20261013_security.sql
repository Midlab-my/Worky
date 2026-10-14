-- Apply manually after the base schema. No existing profiles/jobs/applications are removed.
-- Idempotent. Shared counters/leases enforce limits across all backend instances.
begin;
create schema if not exists worky_private;
revoke all on schema worky_private from public, anon, authenticated;

alter table public.professional_profiles add column if not exists recruitment_visible boolean not null default false;

-- A user may edit their business details, never their entitlement.
revoke insert, update on public.company_profiles from authenticated;
grant insert (user_id, company_name, size, cnpj, location, sector, linkedin)
  on public.company_profiles to authenticated;
grant update (company_name, size, cnpj, location, sector, linkedin)
  on public.company_profiles to authenticated;

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

-- Own-profile policies stay intact. No company gets SELECT on other raw profiles.
drop policy if exists "Pro companies can read profiles for matching" on public.professional_profiles;

create table if not exists worky_private.plan_requests (
  company_id uuid primary key references public.company_profiles(user_id),
  requested_plan text not null check (requested_plan in ('pro','enterprise')),
  requested_at timestamptz not null default now()
);
create table if not exists worky_private.entitlement_audit (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.company_profiles(user_id),
  plan text not null,
  changed_at timestamptz not null default now()
);
create or replace function public.worky_request_plan(p_user uuid, p_plan text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_plan not in ('pro','enterprise') or not exists(select 1 from public.company_profiles where user_id=p_user) then
    raise exception 'Invalid plan request';
  end if;
  insert into worky_private.plan_requests(company_id,requested_plan) values(p_user,p_plan)
    on conflict(company_id) do update set requested_plan=excluded.requested_plan, requested_at=now();
end $$;
create or replace function public.worky_set_company_plan(p_user uuid, p_plan text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_plan not in ('starter','pro','enterprise') then raise exception 'Invalid plan'; end if;
  update public.company_profiles set plan=p_plan where user_id=p_user;
  if not found then raise exception 'Company not found'; end if;
  insert into worky_private.entitlement_audit(company_id,plan) values(p_user,p_plan);
end $$;

-- Explicit opt-in and minimal projection. auth.uid() comes from the verified JWT.
create or replace function public.worky_candidates_for_job(p_job_id uuid)
returns table(profile_json jsonb)
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.company_jobs j join public.company_profiles c on c.user_id=j.company_user_id
    where j.id=p_job_id and c.user_id=auth.uid() and c.plan in ('pro','enterprise')
  ) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  return query select jsonb_build_object(
    'name', left(coalesce(p.profile_json->'form'->>'nome','Candidato'),120),
    'location', left(coalesce(p.profile_json->'form'->>'cidade',''),100),
    'skills', coalesce((select jsonb_agg(jsonb_build_object('label',left(s->>'label',80)))
      from jsonb_array_elements(case when jsonb_typeof(p.profile_json->'skills')='array'
        then p.profile_json->'skills' else '[]'::jsonb end) s
      where jsonb_typeof(s)='object' and s->>'type'='tech'), '[]'::jsonb)
  ) from public.professional_profiles p
  where p.recruitment_visible and p.completed_at is not null
  order by p.updated_at desc limit 40;
end $$;

create table if not exists worky_private.match_usage (
  user_id uuid primary key references auth.users(id), used integer not null default 0 check(used>=0)
);
create table if not exists worky_private.referrals (
  referee uuid primary key references auth.users(id), inviter uuid not null references auth.users(id),
  confirmed_at timestamptz not null default now(), check(referee<>inviter)
);
create or replace function public.worky_quota(p_user uuid)
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object('used',coalesce((select used from worky_private.match_usage where user_id=p_user),0),
    'limit',3+2*((select count(*)::integer from worky_private.referrals where inviter=p_user)/3),
    'referrals',(select count(*)::integer from worky_private.referrals where inviter=p_user));
$$;
create or replace function public.worky_redeem_referral(p_user uuid, p_inviter uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_user=p_inviter or not exists(select 1 from auth.users where id=p_inviter and email_confirmed_at is not null)
    or not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null and created_at>now()-interval '7 days') then
    raise exception 'Invalid referral';
  end if;
  insert into worky_private.referrals(referee,inviter) values(p_user,p_inviter) on conflict(referee) do nothing;
end $$;

create table if not exists worky_private.rate_counters (
  subject text not null, operation text not null, window_start timestamptz not null,
  used integer not null default 0, primary key(subject,operation,window_start)
);
create table if not exists worky_private.ai_leases (
  id uuid primary key, user_id uuid not null references auth.users(id), operation text not null,
  expires_at timestamptz not null
);
create or replace function public.worky_rate_limit(p_subject text, p_operation text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare lim integer; bucket timestamptz; hits integer;
begin
  if length(p_subject)>100 then return false; end if;
  bucket:=date_trunc('minute',now());
  case p_operation
    when 'auth' then lim:=60;
    when 'admin-login' then lim:=8;
    when 'admin-stats' then lim:=40;
    when 'api' then lim:=30;
    when 'ai' then lim:=10;
    when 'ai-day' then lim:=60; bucket:=date_trunc('day',now());
    when 'global-day' then lim:=1000; bucket:=date_trunc('day',now());
    when 'refresh' then lim:=2; bucket:=date_trunc('hour',now());
    else return false;
  end case;
  if p_operation='global-day' then
    delete from worky_private.rate_counters where window_start < now()-interval '2 days';
  end if;
  insert into worky_private.rate_counters(subject,operation,window_start,used)
    values(p_subject,p_operation,bucket,1)
    on conflict(subject,operation,window_start) do update set used=worky_private.rate_counters.used+1
    returning used into hits;
  return hits<=lim;
end $$;

create or replace function public.worky_acquire(p_user uuid, p_operation text, p_lease uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare used_count integer; allowed_count integer;
begin
  if p_operation not in ('career','match','courses','search') then return 'denied'; end if;
  -- One lock covers the global and per-user checks plus the lifetime credit reservation.
  perform pg_advisory_xact_lock(74193021);
  delete from worky_private.ai_leases where expires_at<=now();
  if (select count(*) from worky_private.ai_leases where expires_at>now())>=4
    or exists(select 1 from worky_private.ai_leases where user_id=p_user and expires_at>now()) then return 'busy'; end if;
  if not public.worky_rate_limit(p_user::text,'ai') or not public.worky_rate_limit(p_user::text,'ai-day')
    or not public.worky_rate_limit('all','global-day') then return 'rate'; end if;
  if p_operation='match' then
    insert into worky_private.match_usage(user_id) values(p_user) on conflict do nothing;
    select used into used_count from worky_private.match_usage where user_id=p_user for update;
    select (public.worky_quota(p_user)->>'limit')::integer into allowed_count;
    if used_count>=allowed_count then return 'quota'; end if;
    update worky_private.match_usage set used=used+1 where user_id=p_user;
  end if;
  insert into worky_private.ai_leases(id,user_id,operation,expires_at) values(p_lease,p_user,p_operation,now()+interval '10 minutes');
  return 'ok';
end $$;
create or replace function public.worky_release(p_lease uuid, p_success boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare lease worky_private.ai_leases;
begin
  perform pg_advisory_xact_lock(74193021);
  delete from worky_private.ai_leases where id=p_lease returning * into lease;
  if found and lease.operation='match' and not p_success then
    update worky_private.match_usage set used=greatest(0,used-1) where user_id=lease.user_id;
  end if;
end $$;

-- No RPC accepting a user ID is callable by browsers, even by authenticated users.
revoke all on function public.worky_request_plan(uuid,text), public.worky_set_company_plan(uuid,text),
  public.worky_quota(uuid), public.worky_redeem_referral(uuid,uuid), public.worky_rate_limit(text,text),
  public.worky_acquire(uuid,text,uuid), public.worky_release(uuid,boolean)
  from public, anon, authenticated;
grant execute on function public.worky_request_plan(uuid,text), public.worky_set_company_plan(uuid,text),
  public.worky_quota(uuid), public.worky_redeem_referral(uuid,uuid), public.worky_rate_limit(text,text),
  public.worky_acquire(uuid,text,uuid), public.worky_release(uuid,boolean) to service_role;
revoke all on function public.worky_candidates_for_job(uuid) from public, anon;
grant execute on function public.worky_candidates_for_job(uuid) to authenticated;
revoke all on all tables in schema worky_private from public, anon, authenticated;

comment on column public.professional_profiles.recruitment_visible is
  'Explicit candidate opt-in to share name, city and technical skills with authorized recruiting companies. Default private.';
commit;
