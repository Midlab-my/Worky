-- Cota mensal de buscas de carreira (5/mês), por conta ou IP.
-- Tabela propria: a limpeza de rate_counters (2 dias) nao pode zerar o mes.
begin;

create table if not exists worky_private.search_month_counters (
  subject text not null,
  window_start timestamptz not null,
  used integer not null default 0,
  primary key (subject, window_start)
);

create or replace function public.worky_search_quota(p_subject text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  lim integer := 5;
  bucket timestamptz := date_trunc('month', now());
  hits integer := 0;
begin
  if p_subject is null or length(p_subject) = 0 or length(p_subject) > 100 then
    return jsonb_build_object(
      'used', 0,
      'limit', lim,
      'remaining', lim,
      'resetsAt', (bucket + interval '1 month')
    );
  end if;

  select coalesce(rc.used, 0) into hits
  from worky_private.search_month_counters rc
  where rc.subject = p_subject
    and rc.window_start = bucket;

  hits := coalesce(hits, 0);

  return jsonb_build_object(
    'used', hits,
    'limit', lim,
    'remaining', greatest(lim - hits, 0),
    'resetsAt', (bucket + interval '1 month')
  );
end;
$$;

create or replace function public.worky_consume_search(p_subject text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  lim integer := 5;
  bucket timestamptz := date_trunc('month', now());
  hits integer := 0;
begin
  if p_subject is null or length(p_subject) = 0 or length(p_subject) > 100 then
    return jsonb_build_object(
      'allowed', false,
      'used', lim,
      'limit', lim,
      'remaining', 0,
      'resetsAt', (bucket + interval '1 month')
    );
  end if;

  insert into worky_private.search_month_counters(subject, window_start, used)
  values (p_subject, bucket, 1)
  on conflict (subject, window_start)
  do update set used = worky_private.search_month_counters.used + 1
  where worky_private.search_month_counters.used < lim
  returning used into hits;

  if hits is null then
    select coalesce(rc.used, lim) into hits
    from worky_private.search_month_counters rc
    where rc.subject = p_subject
      and rc.window_start = bucket;

    hits := coalesce(hits, lim);

    return jsonb_build_object(
      'allowed', false,
      'used', hits,
      'limit', lim,
      'remaining', 0,
      'resetsAt', (bucket + interval '1 month')
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'used', hits,
    'limit', lim,
    'remaining', greatest(lim - hits, 0),
    'resetsAt', (bucket + interval '1 month')
  );
end;
$$;

revoke all on function public.worky_search_quota(text), public.worky_consume_search(text)
  from public, anon, authenticated;
grant execute on function public.worky_search_quota(text), public.worky_consume_search(text)
  to service_role;

commit;
