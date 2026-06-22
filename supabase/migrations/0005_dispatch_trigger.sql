-- 0005_dispatch_trigger.sql — Innesco automatico della pipeline (spec §6 "Innesco")
--
-- Quando un nuovo `item` viene inserito con status='processing', deve partire la
-- Edge Function `dispatch`. Qui lo facciamo dal DB con pg_net (`net.http_post`):
-- un trigger AFTER INSERT chiama l'endpoint della funzione passando {item_id}.
-- In più, uno sweep pg_cron ridispaccia gli item rimasti 'processing' non
-- instradati (rete di sicurezza, robustezza a chiamate perse).
--
-- PREREQUISITI (abilitare dal dashboard Supabase, Database > Extensions):
--   - pg_net   (per net.http_post)
--   - pg_cron  (già richiesto da 0004_cron.sql, per lo sweep)
--   - vault    (Supabase Vault: già presente sui progetti Supabase)
--
-- SEGRETI — NON si hardcoda la service_role in SQL. Si leggono a runtime dal
-- Supabase Vault. Prima di usare questa migration imposta i due segreti (una
-- tantum, dal SQL editor del dashboard con un ruolo privilegiato):
--
--   select vault.create_secret(
--     'https://<project-ref>.supabase.co/functions/v1',  -- senza slash finale
--     'project_functions_url');
--   select vault.create_secret(
--     '<SERVICE_ROLE_KEY>',                               -- chiave service role
--     'service_role_key');
--
--   -- Per ruotarli in seguito:
--   -- select vault.update_secret(
--   --   (select id from vault.secrets where name = 'service_role_key'),
--   --   '<NUOVA_KEY>');
--
-- Vedi supabase/README.md (sezione "Innesco della pipeline") per i dettagli.

-- ============================================================================
-- Helper: legge un segreto dal Vault per nome (decrittato).
-- ============================================================================
-- SECURITY DEFINER: il trigger gira nel contesto dell'utente che fa l'INSERT
-- (il client), che NON ha accesso al Vault. La funzione, di proprietà di un
-- ruolo privilegiato, può leggerlo. È a sola lettura e non espone il valore
-- (ritorno usato solo internamente da net.http_post).
create or replace function pipeline_read_secret(secret_name text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = secret_name
  limit 1;
$$;

revoke all on function pipeline_read_secret(text) from public, anon, authenticated;

-- ============================================================================
-- Funzione: invoca `dispatch` per un dato item via pg_net.
-- ============================================================================
-- Centralizza la chiamata HTTP così che trigger e sweep la condividano (DRY).
-- net.http_post è asincrona (mette in coda la richiesta): non blocca l'INSERT
-- né il job cron. Se i segreti non sono configurati, esce in silenzio senza
-- rompere l'INSERT (l'item resta 'processing' → lo sweep ritenterà).
create or replace function pipeline_invoke_dispatch(target_item_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  functions_url text := public.pipeline_read_secret('project_functions_url');
  service_key   text := public.pipeline_read_secret('service_role_key');
begin
  if functions_url is null or service_key is null then
    raise warning 'pipeline_invoke_dispatch: segreti del Vault mancanti (project_functions_url / service_role_key)';
    return;
  end if;

  perform net.http_post(
    url     => functions_url || '/dispatch',
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body    => jsonb_build_object('item_id', target_item_id),
    timeout_milliseconds => 5000
  );
end;
$$;

revoke all on function pipeline_invoke_dispatch(uuid) from public, anon, authenticated;

-- ============================================================================
-- Trigger: AFTER INSERT su items con status='processing' → dispatch.
-- ============================================================================
create or replace function on_item_insert_dispatch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Solo i nuovi item da elaborare (l'app inserisce con status='processing').
  if new.status = 'processing' then
    perform public.pipeline_invoke_dispatch(new.id);
  end if;
  return new;
end;
$$;

create trigger trg_item_insert_dispatch
  after insert on items
  for each row
  execute function on_item_insert_dispatch();

-- ============================================================================
-- Sweep di sicurezza: ridispaccia gli item 'processing' non instradati.
-- ============================================================================
-- Rete di sicurezza per le chiamate perse (Edge Function fredda, errore di rete).
-- "Non instradato" = ancora 'processing', senza raw_content e non in coda media
-- (media_stage='not_needed'), creato da almeno 2 minuti (gli si dà tempo di
-- completare il primo tentativo prima di rilanciarlo).
create or replace function sweep_undispatched_items()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  stuck record;
begin
  for stuck in
    select id
    from public.items
    where status = 'processing'
      and raw_content is null
      and media_stage = 'not_needed'
      and created_at < now() - interval '2 minutes'
    limit 20  -- a sciami: evita di saturare net in un singolo tick.
  loop
    perform public.pipeline_invoke_dispatch(stuck.id);
  end loop;
end;
$$;

-- Ogni 2 minuti (spec §6: sweep ogni 1–2 min).
select cron.schedule(
  'sweep_undispatched_items',
  '*/2 * * * *',
  $$ select public.sweep_undispatched_items(); $$
);

-- ----------------------------------------------------------------------------
-- Per rimuovere lo sweep: select cron.unschedule('sweep_undispatched_items');
-- ----------------------------------------------------------------------------
