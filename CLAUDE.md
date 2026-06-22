# CLAUDE.md — InfoBucket

Regole vincolanti per lo sviluppo autonomo di InfoBucket. Leggile a ogni
sessione. La fonte funzionale è `infobucket-spec.md` (v2); questo file è il
**come** si lavora, quella è il **cosa**.

---

## 1. Cos'è InfoBucket

App mobile personale (**solo Android in v1**, Expo/React Native + TypeScript) per
catturare contenuti da fonti diverse (articoli, YouTube, reel, TikTok, documenti),
farli riassumere/taggare/organizzare dall'AI in background e **ritrovarli per
significato**. Singolo utente. Il valore è il *ritrovare*, non il salvare.

Tre principi non negoziabili:
- **Human-in-the-loop** — l'AI propone (riassunto, tag, bucket); l'utente conferma
  con un tap. Mai scritture automatiche sui dati senza conferma.
- **Cattura leggera, elaborazione pesante lato server** — l'app scrive una riga e
  si chiude; il server fa tutto, anche a telefono spento.
- **Rigenerazione a basso costo** — il `raw_content` estratto si persiste e non si
  butta mai: rigenerare = una sola nuova chiamata AI, senza ri-scaricare la fonte.

## 2. Architettura (3 attori)

1. **App Android** (Expo → APK via EAS) — share intent / add-by-URL, inbox, review,
   conferma in bucket, ricerca. Usa **solo** `anon key` Supabase + auth utente.
2. **Supabase** — Postgres + pgvector, Auth, Storage, pg_cron, Edge Functions
   (`dispatch`, `generate`). È "il cervello", sempre attivo.
3. **Worker** (host economico) — polling, `yt-dlp` + `ffmpeg` + Whisper per
   estrarre audio→testo dai video. Nessuna porta aperta: solo connessioni in uscita.

La generazione AI vive in **un solo posto** (`generate`): tutte le fonti vi
passano. Il worker fa **solo** estrazione media.

## 3. Regole architetturali vincolanti

- **Chiavi/segreti SOLO lato server** (Edge Functions secrets + worker env). MAI nel
  client Expo, MAI nel repo. Il client ha solo `anon key` + auth. `service_role`
  solo lato server. Vedi `.env.example` in ogni package.
- **Modello AI disaccoppiato** — generazione via OpenRouter, modello in
  `OPENROUTER_MODEL` (default `google/gemini-2.5-flash`). Embedding+STT via OpenAI
  (`text-embedding-3-small` → `vector(1536)`, `whisper-1`). Cambiare modello = cambiare
  una env, mai il codice.
- **Nessuno stile hardcoded** nei componenti applicativi. Colori, tipografia,
  spaziature, raggi, ombre derivano **tutti** dall'adattatore tema in
  `app/src/theme/`, che è l'unico punto che conosce il design system. Le schermate
  dipendono solo dall'adattatore, mai dai token grezzi.
- **Tipi di dominio condivisi** in un solo posto (`app/src/types/`) e allineati agli
  enum SQL (`item_status`, `source_type`, `media_stage`). Una sola fonte di verità.
- **RLS attiva** su tutte le tabelle. Le scritture di pipeline usano `service_role`
  lato server; il client accede solo ai propri dati.

## 4. Stile del codice

- **Riutilizzabile e minimale**: niente duplicazioni, funzioni piccole e pure dove
  possibile, estrai l'helper alla seconda ripetizione. Il codice deve leggersi come
  quello attorno (naming, idiomi, densità di commenti).
- **TypeScript strict** ovunque (app + worker). Niente `any` non giustificato.
- **Sicurezza by default**: valida input esterni (URL condivisi, output del modello
  AI come JSON non fidato), nessun segreto nei log, gestisci gli errori senza
  esporre dettagli interni. Sanifica/valida sempre i contenuti remoti.
- **Errori che non spariscono**: se l'elaborazione fallisce, l'item resta visibile in
  inbox con un `error`, non scompare nel nulla.
- Commenti solo dove aggiungono valore (perché, non cosa).

## 5. Test (una feature non è "fatta" finché i test non passano)

- **App**: Jest + React Native Testing Library per logica e componenti; testa la
  business logic (stati, fusione ricerca, parsing, validazione) e i componenti chiave.
- **Edge Functions**: `deno test` per parsing/instradamento/validazione JSON del modello.
- **DB**: test SQL/pgTAP per RPC di ricerca, RLS e job di decadenza dove sensato.
- **Worker**: unit test sui moduli puri (parsing oEmbed/OG, composizione `raw_content`,
  claim atomico) con I/O mockato.
- Privilegia test di **comportamento** su quelli di implementazione. Niente test
  fragili. Mocka rete e servizi esterni.
- Comandi: vedi sezione 8. Esegui i test prima di considerare un task concluso.

## 6. Mappa del codice e review

- **`docs/CODE_MAP.md`** descrive moduli, dipendenze e relazioni. **Aggiornalo a ogni
  modifica strutturale** prima di chiudere il task: serve a capire gli impatti.
- Prima di consolidare un blocco di lavoro, **rivedi il diff** per migliorie di
  ingegneria e sicurezza (riuso, semplificazione, efficienza, vulnerabilità). Usa gli
  skill `/code-review` e `/security-review` quando disponibili.

## 7. Lavoro autonomo con sub-agenti

Quando i compiti sono indipendenti, **parallelizza con sub-agenti** per non saturare
il contesto e recuperare tempo. Confini tipici, isolati per cartella:
`supabase/` · `worker/` · `app/src/features/<feature>` · `docs/`. Dai a ogni agente
un compito chiuso e ben specificato; chiedi che segua questo CLAUDE.md. Tu mantieni
i **contratti condivisi** (tipi, adapter tema, schema) coerenti e fai la review finale.

## 8. Struttura del monorepo e comandi

```
app/         Expo React Native (TypeScript) — il client Android
  src/theme/    adattatore design system (token RN + componenti base) — UNICA fonte stile
  src/types/    tipi di dominio condivisi (allineati agli enum SQL)
  src/lib/      client Supabase, env, utility condivise
  src/features/ schermate per dominio: inbox, review, library, search, capture, settings
supabase/    migrations/ (schema, RLS, indici, cron, RPC) + functions/ (dispatch, generate)
worker/      servizio polling: yt-dlp + ffmpeg + Whisper
design-system/  → cartella "InfoBucket Design System" (fonte di verità VISIVA, web). NON
                  importata a runtime: i token sono portati in app/src/theme.
docs/        CODE_MAP.md, RUN_LOCAL.md, INSTALL_ANDROID.md
```

Comandi (eseguili dal package giusto):
- App: `cd app && npm install && npm test`, `npm run lint`, `npm run typecheck`, `npm start`.
- Worker: `cd worker && npm install && npm test`, `npm run lint`, `npm run typecheck`.
- Edge Functions: `deno test` dentro `supabase/functions/` (sul cloud girano in Deno).

## 9. Git

- Sviluppa sul branch indicato dalla sessione. Commit chiari e descrittivi.
- Mai committare segreti reali. Solo `*.env.example` con placeholder.
- Crea PR solo se richiesto esplicitamente.

## 10. Ordine di sviluppo (dalla spec §16)

Fase 0 Supabase (schema/auth/storage/estensioni/secrets) · Fase 1 skeleton app +
add-by-URL + Inbox · Fase 2 `generate` + `dispatch` (percorso leggero) · Fase 3
review/conferma/rigenera · Fase 4 ricerca ibrida (RPC) · Fase 5 cron decadenza +
sweep · Fase 6 worker media · Fase 7 share intent Android. L'adapter tema esiste dalla
Fase 1. Avere presto un loop funzionante prima della parte nativa e del worker.
