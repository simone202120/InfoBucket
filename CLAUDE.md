# CLAUDE.md — InfoBucket

Regole vincolanti per lo sviluppo autonomo di InfoBucket. **Leggile a ogni
sessione e seguile sempre.** La fonte funzionale è `infobucket-spec.md` (v2);
questo file è il **come** si lavora (standard di qualità, sicurezza, processo),
quella è il **cosa**. La mappa del codice è `docs/CODE_MAP.md`.

Obiettivo di qualità: **codice perfetto e ordinato** — professionale, minimale,
riutilizzabile, sicuro, testato e leggibile come se l'avesse scritto un solo
ingegnere esperto. Niente scorciatoie, niente codice morto, niente "TODO" lasciati
senza tracciamento.

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
  client Expo, MAI nel repo, MAI nei log. Il client ha solo `anon key` + auth.
  `service_role` solo lato server. Solo file `*.env.example` con placeholder nel repo.
- **Modello AI disaccoppiato** — generazione via OpenRouter, modello in
  `OPENROUTER_MODEL` (default `google/gemini-2.5-flash`). Embedding+STT via OpenAI
  (`text-embedding-3-small` → `vector(1536)`, `whisper-1`). Cambiare modello = cambiare
  una env, mai il codice.
- **Nessuno stile hardcoded** nei componenti applicativi. Colori, tipografia,
  spaziature, raggi, ombre derivano **tutti** dall'adattatore tema in
  `app/src/theme/`, unico punto che conosce il design system. Le schermate dipendono
  solo dall'adattatore (`@/theme`), mai dai token grezzi.
- **Una sola fonte di verità** per ogni concetto: tipi di dominio in
  `app/src/types/` (allineati agli enum SQL `item_status`/`source_type`/`media_stage`);
  mapping colonne DB ↔ dominio in un unico modulo; nessun valore duplicato.
- **RLS attiva** (`enable` + `force`) su tutte le tabelle. Il client accede solo ai
  propri dati (`user_id = auth.uid()`); le scritture di pipeline usano `service_role`.
- **Confini netti fra moduli**: dipendenze in una sola direzione (schermate → lib →
  tipi/tema), nessun import circolare, nessuna logica di business nei componenti UI.

## 4. Qualità del codice (codice perfetto e ordinato)

- **Riutilizzabile e minimale**: niente duplicazioni; estrai l'helper alla seconda
  ripetizione (regola DRY, ma non astrarre prima che serva — evita over-engineering).
  Funzioni piccole, pure dove possibile, una responsabilità ciascuna.
- **Leggibilità prima di tutto**: il codice nuovo si legge come quello attorno
  (naming, idiomi, struttura, densità di commenti). Nomi espliciti dal lato del
  dominio. Niente abbreviazioni oscure, niente "magic number" (estrai costanti).
- **TypeScript strict** ovunque (app + worker): `strict`, `noUncheckedIndexedAccess`.
  Niente `any` non giustificato, niente `as` per zittire il compilatore; modella i
  tipi correttamente. Preferisci union discriminate e `readonly` dove ha senso.
- **Gestione errori esplicita**: niente `catch` vuoti, niente errori inghiottiti.
  Gli errori di elaborazione non fanno sparire i dati (item resta in inbox con
  `error`). Messaggi d'errore utili all'utente, dettagli interni mai esposti.
- **Niente codice morto**: nessun import inutilizzato, nessuna funzione non usata,
  nessun commento "vecchio codice". Ogni `// TODO` deve citare la fase (`// TODO Fase N`).
- **Formattazione e lint puliti**: `npm run lint` e `npm run typecheck` devono
  passare senza warning prima di chiudere un task. Stile coerente in tutto il repo.
- **Commenti che spiegano il perché**, non il cosa. Documenta le decisioni non ovvie
  e i vincoli (es. perché una query è fatta così), non la sintassi.
- **File ordinati**: un concetto per file, nomi file coerenti, struttura di cartelle
  prevedibile (vedi §9). Import ordinati e raggruppati.

## 5. Sicurezza (by default, non come ripensamento)

- **Valida ogni input esterno**: URL condivisi, file caricati, parametri, e in
  particolare l'**output del modello AI** (JSON non fidato → parse difensivo, mai
  `eval`, valida forma e tipi prima dell'uso). Funzioni di validazione pure e testate.
- **Segreti**: mai nel client/repo/log; ruotabili via env; principio del minimo
  privilegio (il client ha solo `anon key`).
- **Database**: RLS sempre attiva; query parametrizzate (mai concatenazione di
  stringhe SQL); le RPC con `SECURITY INVOKER` se non c'è motivo contrario.
- **Rete**: il worker non espone porte (solo uscita); timeouts e limiti di
  dimensione sui download; degrada con grazia su fonti ostili.
- **Dipendenze**: aggiungi solo ciò che serve; preferisci pacchetti mantenuti;
  verifica le versioni. Nessuna dipendenza non usata.
- **Privacy**: dati di un solo utente, isolati dalla RLS; nessun dato sensibile nei
  log o negli errori mostrati.
- Esegui una **review di sicurezza** sui file sensibili a ogni blocco di lavoro
  (auth, RLS, parsing input non fidato, gestione segreti, query). Usa
  `/security-review` quando disponibile.

## 6. Test (una feature non è "fatta" finché i test non passano)

- **Copri ogni funzionalità che crei** con test adeguati prima di considerarla conclusa.
- **App**: Jest + React Native Testing Library — business logic (stati, fusione
  ricerca, parsing, validazione, mapping) e componenti chiave (rendering per stato,
  interazioni). Mocka rete e Supabase.
- **Edge Functions**: `deno test` su parsing/instradamento/validazione dell'output AI.
- **DB**: test SQL/pgTAP per RPC di ricerca, RLS (un utente non vede i dati altrui),
  job di decadenza, dove sensato.
- **Worker**: unit test sui moduli puri (parser oEmbed/OG, `composeRawContent`, claim
  atomico) con I/O mockato.
- Privilegia test di **comportamento** sull'implementazione. Niente test fragili o
  tautologici. Copri i casi limite e di errore, non solo l'happy path.
- Esegui i test (`npm test` nel package giusto) e falli passare prima di chiudere.

## 7. Accessibilità e UX (dal brief di design)

- Touch target ≥ **44pt**; raggiungibilità a una mano; tab bar in basso.
- **Contrasto adeguato**, supporto al ridimensionamento del testo, focus visibile,
  rispetto di "riduci movimento" (`prefers-reduced-motion`).
- **Microcopy**: voce attiva, nomi dal lato utente ("Salva", non "Invia"), stesso
  nome dell'azione lungo tutto il flusso, sentence case, niente emoji, niente filler.
- Stati vuoto/errore/caricamento danno **direzione** (cosa fare), non umore.
- **Il riassunto è l'eroe** di ogni schermata (font Newsreader, massima leggibilità).

## 8. Processo: mappa del codice, review, Definition of Done

- **`docs/CODE_MAP.md`** descrive moduli, dipendenze e relazioni. **Aggiornalo a ogni
  modifica strutturale** prima di chiudere il task: serve a capire gli impatti.
- Prima di consolidare, **rivedi il diff** per migliorie di ingegneria e sicurezza
  (riuso, semplificazione, efficienza, vulnerabilità). Usa `/code-review` e
  `/security-review` quando disponibili e applica i rilievi.

**Definition of Done** (tutte le caselle prima di committare una feature):
1. Implementata secondo la spec, senza stile hardcoded e senza segreti nel client.
2. `typecheck` e `lint` puliti, nessun warning nuovo.
3. Test scritti e **verdi** per la logica e i componenti toccati.
4. `docs/CODE_MAP.md` aggiornato se la struttura è cambiata.
5. Diff rivisto (ingegneria + sicurezza), codice morto rimosso.
6. Commit chiaro e descrittivo; push sul branch della sessione.

## 9. Lavoro autonomo con sub-agenti

Quando i compiti sono indipendenti, **parallelizza con sub-agenti** per non saturare
il contesto e recuperare tempo. Confini tipici, isolati per cartella:
`supabase/` · `worker/` · `app/src/features/<feature>` · `docs/`. Dai a ogni agente
un compito chiuso, ben specificato, e chiedi che segua questo CLAUDE.md. Tu mantieni
i **contratti condivisi** coerenti (tipi di dominio ↔ enum SQL, payload `generate`
worker ↔ function, forma riga `items` ↔ mapper, adapter tema) e fai la review finale
integrando i risultati. Non far lavorare due agenti sugli stessi file.

## 10. Struttura del monorepo e comandi

```
app/         Expo React Native (TypeScript) — il client Android
  app/          schermate expo-router (file-based routing)
  src/theme/    adattatore design system (token RN + componenti base) — UNICA fonte stile
  src/types/    tipi di dominio condivisi (allineati agli enum SQL)
  src/lib/      client Supabase, env, mapper, utility pure
  src/features/ logica/UI per dominio: inbox, review, library, search, capture, settings
supabase/    migrations/ (schema, RLS, indici, cron, RPC) + functions/ (dispatch, generate, _shared)
worker/      servizio polling: yt-dlp + ffmpeg + Whisper
InfoBucket Design System/  fonte di verità VISIVA (web). NON importata a runtime: i
                           token sono portati in app/src/theme/tokens.ts (tienili in sync).
docs/        CODE_MAP.md, RUN_LOCAL.md, INSTALL_ANDROID.md
```

Comandi (eseguili dal package giusto):
- App: `cd app && npm install`, `npm test`, `npm run lint`, `npm run typecheck`, `npm start`.
- Worker: `cd worker && npm install`, `npm test`, `npm run lint`, `npm run typecheck`.
- Edge Functions: `deno test` dentro `supabase/functions/` (sul cloud girano in Deno).

## 11. Git

- Sviluppa sul branch indicato dalla sessione. **Commit piccoli e coerenti**, un
  tema per commit, messaggi chiari e descrittivi (cosa e perché).
- Mai committare segreti reali o `node_modules`. Solo `*.env.example` con placeholder.
- Esegui typecheck/lint/test prima del commit. Crea PR solo se richiesto esplicitamente.

## 12. Ordine di sviluppo (dalla spec §16)

Fase 0 Supabase (schema/auth/storage/estensioni/secrets) · Fase 1 skeleton app +
add-by-URL + Inbox · Fase 2 `generate` + `dispatch` (percorso leggero) · Fase 3
review/conferma/rigenera · Fase 4 ricerca ibrida (RPC) · Fase 5 cron decadenza +
sweep · Fase 6 worker media · Fase 7 share intent Android. L'adapter tema esiste dalla
Fase 1. Avere presto un loop funzionante prima della parte nativa e del worker.
