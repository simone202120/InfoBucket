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
5. `0005_dispatch_trigger.sql` — innesco automatico: trigger su INSERT di `items`
   (status='processing') → chiama la Edge Function `dispatch` via `pg_net`; più uno
   sweep pg_cron (ogni 2 min) che ridispaccia gli item `processing` non instradati.
   Spec §6 ("Innesco"). I segreti (URL funzioni + service key) si leggono dal Vault
   (vedi "Innesco della pipeline" sotto).

⚠️ **pg_cron va abilitato dal dashboard** (Database > Extensions > pg_cron)
PRIMA di applicare `0004_cron.sql`. Per `0005` servono anche **pg_net** e **vault**
(Database > Extensions), entrambi disponibili sui progetti Supabase.

Gli enum SQL sono allineati a `app/src/types/domain.ts` (unica fonte di verità
dei tipi di dominio).

## Edge Functions

Fase 2 (spec §16). `dispatch` instrada per tipo ed estrae il `raw_content` inline
per il percorso leggero (articolo via readability+linkedom con fallback a strip
HTML; documento PDF via unpdf e testo semplice; YouTube via transcript pubblico
timedtext), poi chiama `generate`. Le fonti media (reel/tiktok/youtube senza
transcript) vanno in coda (`media_stage='pending'`) per il worker.

`generate` è il cuore AI condiviso: prompt (raw_content + note + bucket) →
OpenRouter, validazione dell'output non fidato (`parseModelOutput`), embedding
OpenAI `text-embedding-3-small`, aggiornamento dell'item a `ready`. È idempotente
e riusabile per la **rigenerazione** (§6.3): rigira sui dati già salvati senza
riscaricare la fonte.

La logica pura sta in `functions/_shared/` ed è testata: `source-type`,
`model-output`, `text` (normalizzazione/troncamento/html→testo), `extract-article`,
`extract-document`, `youtube-transcript`, `ai` (prompt/embedding input),
`fetch-remote` (fetch difensivo con fetcher iniettabile). Le chiamate di rete sono
mockate nei test (nessuna chiamata reale).

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

## Innesco della pipeline (Fase 2)

Spec §6: un nuovo `item` con `status='processing'` deve far partire `dispatch`.
Realizzato in `0005_dispatch_trigger.sql` con un trigger DB + `pg_net`
(`net.http_post`), invece del Database Webhook del dashboard, così l'innesco è
versionato nel repo. Uno sweep pg_cron (ogni 2 min) ridispaccia gli item
`processing` non instradati (rete di sicurezza per le chiamate perse).

La `service_role` **non è hardcodata** in SQL: il trigger la legge dal **Supabase
Vault**. Configura una tantum i due segreti dal SQL editor del dashboard (ruolo
privilegiato), DOPO aver applicato le migration:

```sql
-- URL base delle Edge Functions del progetto (senza slash finale).
select vault.create_secret(
  'https://<project-ref>.supabase.co/functions/v1',
  'project_functions_url');

-- Service role key (la stessa dei secrets delle Edge Functions; mai nel client).
select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
```

Per ruotare un segreto:

```sql
select vault.update_secret(
  (select id from vault.secrets where name = 'service_role_key'),
  '<NUOVA_KEY>');
```

Se i segreti mancano, il trigger non rompe l'INSERT: registra un `warning` e
l'item resta `processing` finché lo sweep non riesce a instradarlo. Prerequisiti:
estensioni **pg_net** e **vault** abilitate (Database > Extensions).
```
