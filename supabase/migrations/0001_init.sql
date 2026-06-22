-- 0001_init.sql — Schema iniziale InfoBucket (spec §5)
--
-- Macchina a stati di ogni elemento:
--   processing → ready → saved | archived → (hard delete)
-- A cui si affianca media_stage (ortogonale), che coordina app ↔ dispatch ↔ worker.
--
-- Nota: `user_id` è incluso qui (riga per riga) perché serve alle policy RLS
-- definite in 0002_rls.sql. È più pulito averlo nello schema base che aggiungerlo
-- dopo: tutte le tabelle nascono già "tenant-aware" per il singolo utente.

-- ============================================================================
-- Estensioni
-- ============================================================================
-- pgvector per gli embedding e la ricerca semantica.
create extension if not exists vector;
-- pgcrypto: gen_random_uuid() (in Supabase è in genere già presente).
create extension if not exists pgcrypto;
-- NB: pg_cron va abilitato dal dashboard Supabase (Database > Extensions) prima
--     di applicare 0004_cron.sql.

-- ============================================================================
-- Tipi enum (allineati ESATTAMENTE a app/src/types/domain.ts)
-- ============================================================================
create type item_status as enum ('processing', 'ready', 'saved', 'archived');

create type source_type as enum ('article', 'youtube', 'reel', 'tiktok', 'document', 'other');

-- Stato della sotto-pipeline di estrazione media (download + STT) gestita dal worker.
create type media_stage as enum ('not_needed', 'pending', 'processing', 'done', 'error');

-- ============================================================================
-- Tabella: buckets (collezioni create dall'utente)
-- ============================================================================
create table buckets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  description text,                       -- usata dall'AI per il matching: descrivi cosa ci va dentro
  created_at  timestamptz not null default now()
);

create index idx_buckets_user_id on buckets (user_id);

-- ============================================================================
-- Tabella: items (gli elementi catturati)
-- ============================================================================
create table items (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source_url            text,            -- null per i documenti caricati
  source_type           source_type not null default 'other',
  storage_path          text,            -- per documenti: path in Supabase Storage
  file_type             text,            -- es. 'application/pdf'
  raw_content           text,            -- grezzo estratto (testo / caption + trascrizione), PERSISTITO per la rigenerazione
  note                  text,            -- nota utente (data alla condivisione o aggiunta in inbox)
  summary               text,            -- output AI
  tags                  text[] not null default '{}',  -- output AI
  suggested_bucket_id   uuid references buckets (id) on delete set null,  -- proposta AI: bucket esistente
  suggested_bucket_name text,            -- proposta AI: nome nuovo bucket (se nessuno calza)
  bucket_id             uuid references buckets (id) on delete set null,  -- impostato alla conferma
  status                item_status not null default 'processing',
  media_stage           media_stage not null default 'not_needed',
  worker_claimed_at     timestamptz,     -- lock leggero: il worker "prende in carico" un item
  embedding             vector(1536),    -- = dimensione di text-embedding-3-small (OpenAI)
  error                 text,            -- eventuale messaggio di errore di elaborazione
  created_at            timestamptz not null default now(),
  processed_at          timestamptz,
  confirmed_at          timestamptz,
  archived_at           timestamptz
);

-- ============================================================================
-- Colonna generata: full-text search in italiano
-- ============================================================================
-- Concatena summary + raw_content + note. Generata e mantenuta dal DB.
alter table items add column fts tsvector
  generated always as (
    to_tsvector('italian',
      coalesce(summary, '') || ' ' || coalesce(raw_content, '') || ' ' || coalesce(note, ''))
  ) stored;

-- ============================================================================
-- Indici
-- ============================================================================
create index idx_items_user_id on items (user_id);

-- Ricerca per tag.
create index idx_items_tags on items using gin (tags);

-- Ricerca semantica (HNSW, cosine) — allineata a text-embedding-3-small.
create index idx_items_embedding on items using hnsw (embedding vector_cosine_ops);

-- Coda worker: trova in fretta gli item che aspettano estrazione media.
create index idx_items_media_queue on items (media_stage) where media_stage = 'pending';

-- Ricerca keyword (full-text in italiano).
create index idx_items_fts on items using gin (fts);
