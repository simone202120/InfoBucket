-- 0006_buckets_dedup.sql — Deduplica i bucket per nome (case-insensitive) e
-- impedisce nuovi duplicati.
--
-- Perché: `createBucket` inseriva SEMPRE una riga nuova, senza vincolo di unicità.
-- Accettare più volte la proposta AGENTE "nuovo bucket" con lo stesso nome creava
-- doppioni (es. 13× "Intelligenza Artificiale"), che poi inquinavano review e
-- libreria. La spec §8 vuole UN bucket per concetto.
--
-- La migration: (1) sposta i riferimenti degli item dai duplicati al bucket
-- "canonico" (il più vecchio dello stesso utente con nome equivalente), (2) elimina
-- i duplicati, (3) aggiunge l'indice unico che impedisce nuovi doppioni.

-- ----------------------------------------------------------------------------
-- 1. Sposta bucket_id degli item dai duplicati al canonico.
-- ----------------------------------------------------------------------------
with canonical as (
  select id,
         first_value(id) over (
           partition by user_id, lower(name) order by created_at, id
         ) as keep_id
  from buckets
)
update items i
set bucket_id = c.keep_id
from canonical c
where i.bucket_id = c.id and c.id <> c.keep_id;

-- 2. Stessa cosa per la proposta AI (suggested_bucket_id).
with canonical as (
  select id,
         first_value(id) over (
           partition by user_id, lower(name) order by created_at, id
         ) as keep_id
  from buckets
)
update items i
set suggested_bucket_id = c.keep_id
from canonical c
where i.suggested_bucket_id = c.id and c.id <> c.keep_id;

-- 3. Elimina i duplicati (tutto tranne il canonico per gruppo).
with canonical as (
  select id,
         first_value(id) over (
           partition by user_id, lower(name) order by created_at, id
         ) as keep_id
  from buckets
)
delete from buckets b
using canonical c
where b.id = c.id and c.id <> c.keep_id;

-- ----------------------------------------------------------------------------
-- 4. Impedisci nuovi duplicati: unicità case-insensitive per utente.
--    (createBucket diventa find-or-create lato client su questo invariante.)
-- ----------------------------------------------------------------------------
create unique index idx_buckets_user_lower_name on buckets (user_id, lower(name));

-- ----------------------------------------------------------------------------
-- 5. Vista di riepilogo per la Libreria: bucket + conteggio item + fonti presenti.
--    security_invoker=on → rispetta la RLS (l'utente vede solo i propri).
-- ----------------------------------------------------------------------------
create view bucket_overview with (security_invoker = on) as
select
  b.id,
  b.name,
  b.description,
  b.created_at,
  count(i.id) as item_count,
  coalesce(
    array_agg(distinct i.source_type) filter (where i.id is not null),
    '{}'
  ) as sources
from buckets b
left join items i on i.bucket_id = b.id
group by b.id, b.name, b.description, b.created_at;
