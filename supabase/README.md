# supabase/ — Backend InfoBucket (Fase 0)

Postgres + pgvector, Auth, Storage, pg_cron, Edge Functions. È "il cervello"
(spec §3). Le chiavi/segreti vivono SOLO qui (secrets) e nel worker — mai nel
client Expo (spec §3, §14).

## Struttura

```
migrations/   schema, RLS, ricerca ibrida, cron (in ordine numerico)
functions/    Edge Functions Deno: dispatch, generate
  _shared/    codice puro condiviso (source-type, model-output, cors, client) + test
.env.example  segreti lato server con placeholder
config.toml   config Supabase CLI per `supabase start`
```

## Migrations — ordine di applicazione

Applicate in ordine numerico (`supabase db push`, oppure dal dashboard SQL):

1. `0001_init.sql` — estensioni (vector, pgcrypto), enum (`item_status`,
   `source_type`, `media_stage`), tabelle `buckets` e `items` (incl. `user_id`,
   `embedding vector(1536)`, `fts` generata in italiano), indici (gin tags,
   hnsw embedding, parziale coda media, gin fts). Spec §5.
2. `0002_rls.sql` — RLS su `buckets` e `items`: il client (`authenticated`)
   accede solo a `user_id = auth.uid()`. La `service_role` bypassa le RLS per
   default. Spec §3, §14.
3. `0003_search.sql` — RPC `search_items(query_embedding, query_text, match_count)`:
   ricerca ibrida semantica + full-text fusa con Reciprocal Rank Fusion,
   `SECURITY INVOKER`, solo `saved`/`archived`. Spec §11.
4. `0004_cron.sql` — job pg_cron: ready>7gg → archived; archived>20gg → delete;
   sweep media `processing` bloccati → pending. Spec §10.

⚠️ **pg_cron va abilitato dal dashboard** (Database > Extensions > pg_cron)
PRIMA di applicare `0004_cron.sql`.

Gli enum SQL sono allineati a `app/src/types/domain.ts` (unica fonte di verità
dei tipi di dominio).

## Edge Functions

Scaffold Fase 2 (spec §16). `dispatch` instrada per tipo; `generate` è il cuore
AI condiviso. La logica pura (rilevamento `source_type`, validazione dell'output
del modello) sta in `functions/_shared/` ed è testata.

```bash
# Test delle funzioni pure (Deno):
cd supabase/functions && deno test

# Servire in locale (carica i segreti):
supabase functions serve --env-file ../.env

# Deploy:
supabase functions deploy dispatch
supabase functions deploy generate
```

## Secrets necessari (spec §14)

Vedi `.env.example`. In produzione:

```bash
supabase secrets set --env-file .env
```

| Variabile | Uso |
|---|---|
| `OPENROUTER_API_KEY` | generazione (summary/tag/bucket) |
| `OPENROUTER_MODEL` | id modello, default `google/gemini-2.5-flash` |
| `OPENAI_API_KEY` | embedding (`text-embedding-3-small`) + STT (`whisper-1`) |
| `SUPABASE_URL` | accesso al DB (auto-iniettata nelle Edge Functions) |
| `SUPABASE_SERVICE_ROLE_KEY` | scritture lato server (auto-iniettata; mai nel client) |

## Innesco della pipeline (Fase 2+)

Spec §6: Database Webhook su `INSERT` di `items` → `dispatch`. In più uno sweep
pg_cron raccoglie gli item `processing` non instradati (rete di sicurezza).
```
