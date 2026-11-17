-- =============================================================================
-- CyberProof – hardening dopo gli advisor di Supabase
--
-- 1. handle_new_user() serve solo come trigger: nessuno deve poterla chiamare via API.
-- 2. current_organization_id() spostata in uno schema non esposto da PostgREST,
--    così resta utilizzabile dalle policy ma non è un endpoint /rpc.
-- 3. Indice sulla chiave esterna composta delle evidenze.
-- =============================================================================

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.current_organization_id() returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.organizations where owner_id = auth.uid()
$$;

revoke execute on function private.current_organization_id() from public, anon;
grant execute on function private.current_organization_id() to authenticated;

-- Policy ricreate sulla nuova funzione.
drop policy "controls_all_own_org" on public.security_controls;
create policy "controls_all_own_org" on public.security_controls
  for all to authenticated
  using (organization_id = (select private.current_organization_id()))
  with check (organization_id = (select private.current_organization_id()));

drop policy "evidences_all_own_org" on public.evidences;
create policy "evidences_all_own_org" on public.evidences
  for all to authenticated
  using (organization_id = (select private.current_organization_id()))
  with check (organization_id = (select private.current_organization_id()));

drop policy "evidence_files_select_own_org" on storage.objects;
create policy "evidence_files_select_own_org" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'evidence-files'
    and (storage.foldername(name))[1] = (select private.current_organization_id())::text
  );

drop policy "evidence_files_insert_own_org" on storage.objects;
create policy "evidence_files_insert_own_org" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'evidence-files'
    and (storage.foldername(name))[1] = (select private.current_organization_id())::text
  );

drop policy "evidence_files_delete_own_org" on storage.objects;
create policy "evidence_files_delete_own_org" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'evidence-files'
    and (storage.foldername(name))[1] = (select private.current_organization_id())::text
  );

drop function public.current_organization_id();

drop index public.evidences_control_idx;
create index evidences_control_org_idx on public.evidences (control_id, organization_id);
