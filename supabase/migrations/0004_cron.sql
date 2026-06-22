-- 0004_cron.sql — Ciclo di vita / decadenza e sweep di robustezza (spec §10)
--
-- PREREQUISITO: l'estensione pg_cron va abilitata dal dashboard Supabase
--   (Database > Extensions > pg_cron) PRIMA di applicare questa migration.
--   Senza pg_cron le cron.schedule(...) qui sotto falliscono.
--
-- I job girano lato server, indipendentemente dall'app aperta. Le funzioni sono
-- SECURITY DEFINER perché pg_cron le esegue senza un utente autenticato: devono
-- agire su tutte le righe, scavalcando le RLS (come farebbe la service_role).

-- ============================================================================
-- Funzione: archivia gli item 'ready' più vecchi di 7 giorni
-- ============================================================================
-- ready (in inbox, non confermati) più vecchi di 7gg da created_at → archived.
create or replace function lifecycle_archive_ready()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.items
  set status = 'archived',
      archived_at = now()
  where status = 'ready'
    and created_at < now() - interval '7 days';
$$;

-- ============================================================================
-- Funzione: hard delete degli item 'archived' più vecchi di 20 giorni
-- ============================================================================
-- archived più vecchi di 20gg da archived_at → hard delete.
-- NB: la rimozione dell'eventuale file da Storage (spec §10) va gestita lato
--     server (Edge Function / worker) ascoltando le delete o con un job apposito:
--     da SQL non si tocca lo Storage. I 'saved' non decadono mai.
create or replace function lifecycle_delete_archived()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.items
  where status = 'archived'
    and archived_at is not null
    and archived_at < now() - interval '20 days';
$$;

-- ============================================================================
-- Funzione: sweep dei media 'processing' bloccati (worker morto a metà)
-- ============================================================================
-- media_stage = 'processing' con worker_claimed_at troppo vecchio (>10 min)
-- → rimesso a 'pending' così un worker lo ri-prende.
create or replace function sweep_stale_media_claims()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.items
  set media_stage = 'pending',
      worker_claimed_at = null
  where media_stage = 'processing'
    and worker_claimed_at is not null
    and worker_claimed_at < now() - interval '10 minutes';
$$;

-- ============================================================================
-- Schedule pg_cron
-- ============================================================================
-- Decadenza: giornaliera (spec §10). Eseguite alle 03:00 e 03:05 UTC.
select cron.schedule(
  'lifecycle_archive_ready',
  '0 3 * * *',
  $$ select public.lifecycle_archive_ready(); $$
);

select cron.schedule(
  'lifecycle_delete_archived',
  '5 3 * * *',
  $$ select public.lifecycle_delete_archived(); $$
);

-- Sweep media bloccati: ogni 5 minuti (la coda è time-sensitive).
select cron.schedule(
  'sweep_stale_media_claims',
  '*/5 * * * *',
  $$ select public.sweep_stale_media_claims(); $$
);

-- ----------------------------------------------------------------------------
-- Per rimuovere un job: select cron.unschedule('<jobname>');
-- ----------------------------------------------------------------------------
