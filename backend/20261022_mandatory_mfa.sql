begin;
-- Restrictive policies AND the AAL requirement with existing ownership rules.
-- No users, factors, sessions or existing permissive policies are deleted.
do $$
declare t text;
begin
  foreach t in array array['career_analyses','professional_profiles','company_profiles','company_jobs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists worky_require_aal2 on public.%I', t);
    execute format('create policy worky_require_aal2 on public.%I as restrictive for all to authenticated using ((select auth.jwt()->>''aal'') = ''aal2'') with check ((select auth.jwt()->>''aal'') = ''aal2'')', t);
  end loop;
end $$;
-- Avatars remain intentionally public for reading; writes require MFA.
drop policy if exists worky_avatar_insert_aal2 on storage.objects;
create policy worky_avatar_insert_aal2 on storage.objects as restrictive for insert to authenticated
with check (bucket_id <> 'profile-avatars' or (select auth.jwt()->>'aal') = 'aal2');
drop policy if exists worky_avatar_update_aal2 on storage.objects;
create policy worky_avatar_update_aal2 on storage.objects as restrictive for update to authenticated
using (bucket_id <> 'profile-avatars' or (select auth.jwt()->>'aal') = 'aal2')
with check (bucket_id <> 'profile-avatars' or (select auth.jwt()->>'aal') = 'aal2');
drop policy if exists worky_avatar_delete_aal2 on storage.objects;
create policy worky_avatar_delete_aal2 on storage.objects as restrictive for delete to authenticated
using (bucket_id <> 'profile-avatars' or (select auth.jwt()->>'aal') = 'aal2');

-- SECURITY DEFINER bypasses table RLS, so this RPC also needs an explicit check.
create or replace function public.worky_candidates_for_job(p_job_id uuid)
returns table(profile_json jsonb)
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.jwt()->>'aal') is distinct from 'aal2' then
    raise exception 'AAL2 required' using errcode='42501';
  end if;
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
revoke all on function public.worky_candidates_for_job(uuid) from public, anon;
grant execute on function public.worky_candidates_for_job(uuid) to authenticated;
commit;
