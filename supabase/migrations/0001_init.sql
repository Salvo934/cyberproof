-- =============================================================================
-- CyberProof – schema iniziale
--
-- Modello: un'organizzazione per account. Ogni tabella è protetta da Row Level
-- Security: un utente può leggere e modificare solo i dati della propria
-- organizzazione. I documenti di evidenza sono in un bucket privato, con
-- percorso {organization_id}/{control_id}/{evidence_id}/{file}.
--
-- Da eseguire una volta nel SQL Editor di Supabase (o con `supabase db push`).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabelle
-- -----------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  sector text not null default '' check (char_length(sector) <= 120),
  nis2_classification text not null default 'non_determinata'
    check (nis2_classification in ('essenziale', 'importante', 'non_determinata')),
  created_at timestamptz not null default now()
);

create table public.security_controls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9-]{1,23}$'),
  name text not null check (char_length(name) between 1 and 120),
  category text not null check (category in (
    'governance', 'gestione_accessi', 'backup_continuita', 'logging_monitoraggio',
    'gestione_incidenti', 'gestione_vulnerabilita', 'formazione', 'fornitori', 'crittografia'
  )),
  description text not null default '' check (char_length(description) <= 1000),
  status text not null default 'da_valutare'
    check (status in ('da_valutare', 'in_lavorazione', 'documentato', 'da_verificare')),
  implementation text not null default 'non_definita'
    check (implementation in ('non_definita', 'pianificata', 'parziale', 'attuata')),
  owner text not null check (char_length(owner) between 1 and 120),
  last_verified_at date,
  regulatory_references jsonb not null default '[]'::jsonb
    check (jsonb_typeof(regulatory_references) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code),
  -- Necessario per il vincolo composto delle evidenze (stessa organizzazione).
  unique (id, organization_id)
);

create table public.evidences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  control_id uuid not null,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  document_type text not null check (document_type in (
    'policy', 'procedura', 'registro', 'report_tecnico', 'screenshot',
    'verbale', 'attestato', 'contratto', 'altro'
  )),
  collected_at date not null,
  owner text not null check (char_length(owner) between 1 and 120),
  notes text not null default '' check (char_length(notes) <= 1000),
  reference_location text check (char_length(reference_location) <= 300),
  -- Metadati del file archiviato nel bucket privato (tutti presenti o tutti assenti).
  file_path text,
  file_name text,
  file_mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes between 1 and 20971520),
  file_sha256 text check (file_sha256 is null or file_sha256 ~ '^[0-9a-f]{64}$'),
  file_uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- L'evidenza deve appartenere a un controllo della stessa organizzazione.
  foreign key (control_id, organization_id)
    references public.security_controls (id, organization_id) on delete cascade,
  check (
    (file_path is null and file_name is null and file_mime_type is null
      and file_size_bytes is null and file_sha256 is null and file_uploaded_at is null)
    or
    (file_path is not null and file_name is not null and file_mime_type is not null
      and file_size_bytes is not null and file_sha256 is not null and file_uploaded_at is not null)
  ),
  -- Il file deve stare nella cartella della propria organizzazione/controllo/evidenza.
  check (
    file_path is null
    or file_path like organization_id::text || '/' || control_id::text || '/' || id::text || '/%'
  )
);

create index security_controls_organization_idx on public.security_controls (organization_id);
create index evidences_organization_idx on public.evidences (organization_id);
create index evidences_control_idx on public.evidences (control_id);

-- -----------------------------------------------------------------------------
-- updated_at automatico
-- -----------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger security_controls_updated_at before update on public.security_controls
  for each row execute function public.set_updated_at();
create trigger evidences_updated_at before update on public.evidences
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Organizzazione creata automaticamente alla registrazione
-- -----------------------------------------------------------------------------

create function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organizations (owner_id, name)
  values (
    new.id,
    coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'organization_name'), 120), ''), 'La mia organizzazione')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

-- Restituisce l'organizzazione dell'utente corrente (una per account).
create function public.current_organization_id() returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.organizations where owner_id = auth.uid()
$$;

revoke execute on function public.current_organization_id() from public, anon;
grant execute on function public.current_organization_id() to authenticated;

alter table public.organizations enable row level security;
alter table public.security_controls enable row level security;
alter table public.evidences enable row level security;

-- Organizzazione: lettura e modifica solo da parte del proprietario.
-- La creazione avviene solo tramite il trigger di registrazione.
create policy "organizations_select_own" on public.organizations
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "organizations_update_own" on public.organizations
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "controls_all_own_org" on public.security_controls
  for all to authenticated
  using (organization_id = (select public.current_organization_id()))
  with check (organization_id = (select public.current_organization_id()));

create policy "evidences_all_own_org" on public.evidences
  for all to authenticated
  using (organization_id = (select public.current_organization_id()))
  with check (organization_id = (select public.current_organization_id()));

-- Nessun accesso per gli utenti non autenticati.
revoke all on public.organizations, public.security_controls, public.evidences from anon;

-- -----------------------------------------------------------------------------
-- Storage: bucket privato per i documenti di evidenza
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence-files',
  'evidence-files',
  false,
  20971520, -- 20 MB
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;

-- Accesso ai file solo nella cartella della propria organizzazione.
create policy "evidence_files_select_own_org" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'evidence-files'
    and (storage.foldername(name))[1] = (select public.current_organization_id())::text
  );

create policy "evidence_files_insert_own_org" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'evidence-files'
    and (storage.foldername(name))[1] = (select public.current_organization_id())::text
  );

create policy "evidence_files_delete_own_org" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'evidence-files'
    and (storage.foldername(name))[1] = (select public.current_organization_id())::text
  );
-- Nessuna policy di UPDATE: un file archiviato non si sovrascrive, si sostituisce.
