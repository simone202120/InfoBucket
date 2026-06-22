-- 0003_search.sql — Ricerca ibrida (spec §11)
--
-- RPC `search_items`: una sola chiamata dal client che fonde, lato DB:
--   1. ricerca semantica (cosine su embedding, OpenAI text-embedding-3-small)
--   2. ricerca keyword (full-text Postgres su fts, italiano)
-- e restituisce le righe items ordinate per rilevanza combinata.
--
-- Ambito: solo status in ('saved', 'archived') (spec §11 — non i 'processing'/'ready').
-- Sicurezza: SECURITY INVOKER → la query gira con i privilegi del chiamante,
-- quindi le RLS di 0002 si applicano. In più filtriamo esplicitamente per
-- user_id = auth.uid() (difesa in profondità e per chiarezza dell'intento).

-- ============================================================================
-- Fusione: Reciprocal Rank Fusion (RRF)
-- ============================================================================
-- Ogni candidato riceve un punteggio 1 / (k + rank) in ciascuna lista
-- (semantica e keyword), e i due punteggi si sommano. RRF è robusto perché
-- combina i RANGHI, non i punteggi grezzi (cosine e ts_rank non sono comparabili
-- direttamente). k=60 è il valore classico della letteratura: smorza il peso
-- delle prime posizioni evitando che una sola lista domini.

create or replace function search_items(
  query_embedding vector(1536),
  query_text      text,
  match_count     int default 20
)
returns setof items
language sql
stable
security invoker
set search_path = ''
as $$
  with
  -- Candidati semantici: i più vicini per cosine distance (<=>).
  -- Ordinati per distanza crescente; il rank diventa peso RRF.
  semantic as (
    select
      i.id,
      row_number() over (order by i.embedding <=> query_embedding) as rank
    from public.items i
    where i.user_id = auth.uid()
      and i.status in ('saved', 'archived')
      and i.embedding is not null
      and query_embedding is not null
    order by i.embedding <=> query_embedding
    limit greatest(match_count * 4, match_count)
  ),
  -- Candidati keyword: full-text match in italiano, ordinati per ts_rank.
  keyword as (
    select
      i.id,
      row_number() over (
        order by ts_rank(i.fts, websearch_to_tsquery('italian', query_text)) desc
      ) as rank
    from public.items i
    where i.user_id = auth.uid()
      and i.status in ('saved', 'archived')
      and query_text is not null
      and query_text <> ''
      and i.fts @@ websearch_to_tsquery('italian', query_text)
    order by ts_rank(i.fts, websearch_to_tsquery('italian', query_text)) desc
    limit greatest(match_count * 4, match_count)
  ),
  -- Fusione RRF: somma dei contributi delle due liste (full outer join sugli id).
  fused as (
    select
      coalesce(s.id, k.id) as id,
      coalesce(1.0 / (60 + s.rank), 0.0) + coalesce(1.0 / (60 + k.rank), 0.0) as score
    from semantic s
    full outer join keyword k on s.id = k.id
  )
  select i.*
  from fused f
  join public.items i on i.id = f.id
  order by f.score desc
  limit match_count;
$$;
