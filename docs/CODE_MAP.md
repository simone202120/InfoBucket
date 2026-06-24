# Mappa del codice — InfoBucket

Mappa di moduli, dipendenze e relazioni. Serve a capire **gli impatti di una
modifica** prima di farla. Aggiornala a ogni cambiamento strutturale (regola
in `CLAUDE.md` §6).

> Stato: **v1 completa + fix funzionali** (Fasi 0-7). App: login, Inbox, aggiungi-via-URL,
> review/conferma/rigenera, archivio, ricerca ibrida e **share intent Android**. Backend:
> migrations 0001-0005 (schema, RLS, RPC ricerca, cron, innesco dispatch) e tre Edge
> Functions (`dispatch`, `generate`, `search`) con estrazione inline del percorso
> leggero. Worker: estrazione media (yt-dlp + ffmpeg + Whisper) implementata.
> Gli item percorrono la pipeline completa `processing → ready`.
> Fix piano 1: polling durante la lavorazione, refetch al focus, toast di conferma,
> sheet trascrizione, AvatarMenu (Impostazioni/Esci), skeleton di lista.

---

## Vista d'insieme

```
                 ┌──────────────────────────────────────────────┐
   app/  ───────▶│  Supabase: Postgres + RLS + RPC + Functions  │◀─────── worker/
 (client Expo)   │  (anon key dal client, service role server)  │   (service role)
   solo lettura  └──────────────────────────────────────────────┘   estrazione media
   /scrittura          ▲ dispatch              ▲ generate
   sui propri dati      └── instrada ──────────┘ (OpenRouter + OpenAI embedding)
```

Flusso di un elemento (macchina a stati, spec §5):
`insert (processing)` → **dispatch** instrada → percorso leggero *oppure* worker
→ **generate** (summary/tag/bucket + embedding) → `ready` → conferma utente →
`saved` | decadenza → `archived` → delete.

---

## `app/` — client Expo / React Native (TypeScript)

Entry: `expo-router` (cartella `app/app/`).

| File | Ruolo | Dipende da |
|---|---|---|
| `app/_layout.tsx` | Root: carica i font, monta `ThemeProvider`, Stack router | `@/theme`, expo-font/router |
| `src/types/domain.ts` | **Tipi di dominio** (ItemStatus, SourceType, MediaStage, Item, Bucket). Unica fonte di verità lato client, allineata agli enum SQL | — |
| `src/theme/tokens.ts` | Valori grezzi del design system (temi **Cloud**/**Ink** con `scrim`, accenti incl. preset estesi, type, spacing, radii, shadow). Porting dei `.css` | — |
| `src/theme/index.ts` | **Adapter del tema**: `ThemeProvider`, `useTheme`, `useThemeControls`, `sourceColor()`. Gestisce accento preset **o personalizzato** (via `accent.ts`) con preferenze persistite (`themeStorage.ts`). UNICO punto che l'app conosce per lo stile | `tokens.ts`, `accent.ts`, `themeStorage.ts`, `types/domain.ts` |
| `src/theme/accent.ts` | Derivazione **pura** dell'accento personalizzato: luminanza/contrasto WCAG, varianti hover/press/soft e testo a contrasto AA | — |
| `src/theme/themeStorage.ts` | Load/save delle preferenze tema (accento, colore custom, modo) in AsyncStorage; parsing difensivo → default | `tokens.ts` |
| `src/theme/haptics.ts` | Wrapper aptico (`haptics.success`/`light`) — unico punto che conosce `expo-haptics`; "fire and forget", non lancia mai | `expo-haptics` |
| `src/theme/icons.tsx` | Icone (wrapper `lucide-react-native`) + **loghi brand reali** (YouTube/Instagram/TikTok, SVG) + **glifi duotone** (documento/nota/articolo) + `SOURCE_ICON` | `types/domain.ts`, `react-native-svg` |
| `src/theme/components/*` | **Libreria UI** (RN) del design system: Button, TextField, NoteField, SourceStamp, StatusBadge, Tag, BucketChip, **BucketCard**, ItemCard (con **rail di provenienza** + draw-in e **swipe** Archivia/Rivedi), EmptyState, ErrorBanner, AddButton, **TabBar**, **AvatarMenu**, **ListSkeleton** (shimmer), **Toast** (entrata/uscita animata), **TranscriptSheet**, **AccentPicker**, **Favicon**, **ScreenHeader**, **Wordmark**. Stile solo da `useTheme()` | `@/theme`, `icons`, `react-native-gesture-handler` |
| `src/theme/components/AccentPicker.tsx` | Selettore di accento personalizzato (tinte rapide + campo esadecimale validato), senza dipendenze esterne | `@/theme` |
| `src/theme/components/Favicon.tsx` | Favicon reale del dominio di un articolo (servizio Google), con fallback al glifo se manca/non carica | `@/lib/source` |
| `src/theme/components/ScreenHeader.tsx` | Header editoriale condiviso (occhiello mono + titolo display + slot azioni), usato nelle tre tab | `@/theme` |
| `src/theme/components/Wordmark.tsx` | Marchio InfoBucket (glifo a trattini-provenienza + logotype), usato in login e splash | `@/theme` |
| `src/theme/ToastProvider.tsx` | Context + provider per il feedback effimero (`useToast().showToast`). Montato nel root layout; `Toast.tsx` è il componente visivo | `@/theme` |
| `src/theme/components/Toast.tsx` | Pill di notifica effimera (messaggio + auto-dismiss); usata tramite `useToast` | `@/theme` |
| `src/theme/components/TranscriptSheet.tsx` | Sheet a tutta pagina con trascrizione/testo completo, disponibile per tutte le fonti che espongono `raw_content` | `@/theme` |
| `src/theme/components/AvatarMenu.tsx` | Avatar utente con menu a tendina (Impostazioni / Esci) negli header delle schermate principali | `@/theme`, `AuthProvider` |
| `src/theme/components/ListSkeleton.tsx` | Placeholder skeleton di lista mostrato al primo caricamento, prima che i dati arrivino | `@/theme` |
| `src/theme/motion.tsx` | Primitive di animazione sobrie (`FadeInUp`, `PressableScale`, `staggerDelay`, `useReducedMotion`), rispettano "riduci movimento". Esposte da `@/theme` | `@/theme` |
| `src/lib/env.ts` | Legge/valida `EXPO_PUBLIC_*` (solo URL + anon key, nessun segreto) | — |
| `src/lib/supabase.ts` | Client Supabase (anon key + auth, AsyncStorage) | `env.ts` |
| `src/lib/mappers.ts` | Mapping righe DB snake_case ↔ tipi di dominio camelCase | `types/domain.ts` |
| `src/lib/source.ts` | Rilevamento `SourceType` da URL, `hostnameOf`, `isValidHttpUrl` e `extractFirstUrl` (estrae il primo URL da un testo, usato dallo share intent). Logica pura | `types/domain.ts` |
| `src/lib/lifecycle.ts` | Countdown decadenza lato client (giorni all'archivio/cancellazione) | `types/domain.ts` |
| `src/lib/items.ts` | **Repository `items`**: `listInbox`, `listArchived`, `addItemByUrl` (valida URL, rileva source), `getItem`, `updateItem`, `confirmItem`, `archiveItem` (decadimento manuale), `deleteItem`, `regenerate`, `searchItems` (invoca la Edge Function `search`) | `supabase`, `mappers`, `source` |
| `src/lib/buckets.ts` | **Repository `buckets`**: `listBuckets`, `createBucket` | `supabase`, `mappers` |
| `src/features/auth/` | `AuthProvider` + `useAuth` (email/password Supabase, sessione persistita, errori in italiano) | `@/lib/supabase` |
| `src/features/useItemList.ts` | Hook generico lista item (loading/refreshing/error/refetch), riusato da Inbox e Archivio | — |
| `src/features/usePolling.ts` | Avvia un intervallo di polling sul refetch di una lista finché almeno un item è in stato `processing`; si ferma da solo quando la coda si svuota | — |
| `src/features/useFocusRefetch.ts` | Esegue un refetch automatico ogni volta che la schermata torna in foreground (via `useFocusEffect`) | expo-router |
| `src/features/inbox/useInbox.ts` | Stato Inbox (su `useItemList` + `listInbox`) | `useItemList`, `@/lib/items` |
| `src/features/inbox/groupInbox.ts` | Raggruppamento **puro** degli item Inbox in "in scadenza" / "recenti" (per le sezioni della lista) | `@/lib/lifecycle` |
| `src/features/archive/useArchive.ts` | Stato Archivio (su `useItemList` + `listArchived`) | `useItemList`, `@/lib/items` |
| `src/features/review/useItemDetail.ts` | Stato dettaglio/review di un item: caricamento, conferma in bucket, modifica, rigenera, elimina | `@/lib/items`, `@/lib/buckets` |
| `src/features/review/ReviewScreen.tsx` | UI di review: **lettura immersiva** di default (riassunto eroe + Modifica) / modalità edit (summary, tag, nota); scelta bucket, azioni (conferma/rigenera/elimina); conferma → toast + aptico e torna indietro; bottone trascrizione apre `TranscriptSheet` | `useItemDetail`, `@/theme`, `@/theme/haptics` |
| `src/features/search/useSearch.ts` | Stato ricerca: query con debounce, fusione risultati, loading/error | `@/lib/items` |
| `src/features/library/useLibrary.ts` | Stato Libreria: bucket con statistiche | `@/lib/buckets` |
| `src/features/library/useBucketDetail.ts` | Stato dettaglio bucket: testata + item del bucket | `@/lib/buckets`, `@/lib/items` |
| `src/features/settings/useBucketAdmin.ts` | Gestione bucket dalle Impostazioni: carica, rinomina, elimina | `@/lib/buckets` |

**Schermate (`app/app/`, expo-router file-based):**

| Route | File | Ruolo |
|---|---|---|
| `_layout` | `app/_layout.tsx` | Carica font, monta `ThemeProvider`+`AuthProvider`+`ShareIntentProvider`, **auth-gate** (redirect login↔app) e **share intent**: a link condiviso → apre /add precompilato (`extractFirstUrl`). Registra le route (incl. `bucket/[id]`, `settings` modale) |
| `(tabs)/_layout` | `app/(tabs)/_layout.tsx` | Monta il **`TabBar` del design system** (Inbox·Libreria·Cerca) adattando lo stato di expo-router (rotta↔tab) + **AddButton "+" flottante GLOBALE** sopra la barra |
| `/login` | `app/login.tsx` | Accesso/registrazione (usa `useAuth`, `Button`, `TextField`, `ErrorBanner`) |
| `/` (tab) | `app/(tabs)/index.tsx` | **Inbox**: `SectionList` a sezioni (**In scadenza / Recenti** via `groupInbox`) di `ItemCard` (comparsa staggered, **swipe** Archivia/Rivedi), pull-to-refresh, `ScreenHeader` con Archivio + **AvatarMenu**, skeleton al primo caricamento, polling automatico se ci sono item in lavorazione, refetch al focus; stato vuoto/errore |
| `/search` (tab) | `app/(tabs)/search.tsx` | **Ricerca** ibrida (semantica + keyword) su saved/archived via `useSearch` → Edge Function `search` |
| `/library` (tab) | `app/(tabs)/library.tsx` | **Libreria**: griglia di `BucketCard` (`useLibrary`), "Nuovo bucket", tap → dettaglio bucket; refetch al focus |
| `/bucket/[id]` | `app/bucket/[id].tsx` | **Dettaglio bucket** (`useBucketDetail`): elementi salvati, tap → review |
| `/settings` | `app/settings.tsx` | **Impostazioni** (modale): account/logout, aspetto (accento preset **o personalizzato** + tema chiaro/scuro), gestione bucket, ciclo di vita |
| `/add` | `app/add.tsx` | Modale **Aggiungi-URL** (usa `addItemByUrl`, `TextField`, `NoteField`) |
| `/item/[id]` | `app/item/[id].tsx` | **Review/dettaglio** item (monta `ReviewScreen`): legge `id` dall'URL |
| `/archive` | `app/archive.tsx` | **Archivio**: item decaduti, recuperabili salvandoli in un bucket (§10) |

**Regola di dipendenza:** le schermate (`app/app/*`, `src/features/*`) importano **solo**
da `@/theme`(+`/components`,`/icons`), `@/types`, `@/lib`, `@/features`. Mai i token
grezzi, mai i nomi delle colonne DB.

Impatti tipici:
- Cambi un colore/spaziatura → `tokens.ts` (adapter, componenti e schermate non cambiano).
- Cambi un componente UI → `src/theme/components/` (le schermate lo riusano).
- Cambi un enum di stato → aggiorna **insieme** `types/domain.ts` e la migration SQL.
- Cambi nomi colonna DB → solo `mappers.ts` (+ migration).
- Cambi forma query `items` → solo `src/lib/items.ts`.

**Config nativo (EAS):** `app.config.ts` definisce app + plugin; `eas.json` definisce i
profili di build (`development`/`preview`/`production`, tutti APK). `plugins/withAndroidReleaseTuning.js`
è un config plugin locale che limita `reactNativeArchitectures` a `arm64-v8a` in
`gradle.properties` (EAS rigenera `android/` a ogni build, quindi va fatto via plugin,
non a mano): le 4 ABI di default facevano andare in OOM il worker durante la
compilazione C++. Cambi sulle ABI/proprietà Gradle → solo questo plugin; cambi sui
profili di build → solo `eas.json`. La root del progetto Expo è `app/` (lì stanno
`package.json`, `app.config.ts`, `eas.json`): per il "Build from GitHub" la base
directory su EAS va impostata a `app`.

## `supabase/` — backend (il cervello)

| File | Ruolo |
|---|---|
| `migrations/0001_init.sql` | Estensioni, enum, tabelle `buckets`/`items` (+`user_id`), indici (gin tags, hnsw embedding, parziale media-queue, gin fts) |
| `migrations/0002_rls.sql` | RLS su entrambe le tabelle, policy `user_id = auth.uid()`; service role bypassa |
| `migrations/0003_search.sql` | RPC `search_items()` — ricerca ibrida (semantica + full-text) con fusione RRF, `SECURITY INVOKER` |
| `migrations/0004_cron.sql` | Job pg_cron: ready>7gg→archived, archived>20gg→delete, sweep claim media bloccati |
| `migrations/0005_dispatch_trigger.sql` | Innesco automatico: trigger AFTER INSERT su `items` (`status='processing'`) → chiama `dispatch` via `pg_net`; sweep pg_cron (2 min) ridispaccia gli item non instradati. Service role letta dal **Vault** (`project_functions_url`, `service_role_key`), non hardcodata |
| `migrations/0006_buckets_dedup.sql` | Deduplica i bucket (fonde i doppioni sul più vecchio), indice unico `(user_id, lower(name))`, vista `bucket_overview` (conteggio + fonti, `security_invoker`) per la Libreria |
| `functions/_shared/source-type.ts` | Rilevamento `source_type` (autorevole, lato server) — gemello puro di `app/src/lib/source.ts` |
| `functions/_shared/caption.ts` | Estrazione caption tiktok/reel/**youtube** (oEmbed/Open Graph) + `composeCaptionRawContent` — gemello puro di `worker/src/extract/caption.ts`. Dà il riassunto da didascalia senza worker né login |
| `functions/_shared/model-output.ts` | Parsing/validazione dell'output JSON del modello (input **non fidato**) |
| `functions/_shared/ai.ts` | Costruzione prompt + chiamate OpenRouter (chat) e OpenAI (`embed`) |
| `functions/_shared/text.ts` | Normalizzazione/troncamento testo, html→testo |
| `functions/_shared/extract-article.ts` | Estrazione articolo (readability + linkedom, fallback strip HTML) |
| `functions/_shared/extract-document.ts` | Estrazione documento PDF (unpdf) e testo semplice |
| `functions/_shared/youtube-transcript.ts` | Transcript pubblico YouTube (timedtext) |
| `functions/_shared/fetch-remote.ts` | Fetch difensivo (timeout/limiti, fetcher iniettabile) |
| `functions/_shared/invoke.ts` | Invocazione function→function (es. dispatch → generate) con service role |
| `functions/_shared/{cors,supabase}.ts` | Helper CORS + client service role / user (inoltra JWT) |
| `functions/dispatch/index.ts` | Instrada un item: percorso leggero (article/document/yt-transcript, **e caption tiktok/reel/youtube via oEmbed/OG**) → estrae `raw_content` inline e chiama `generate`; per tiktok/reel/youtube-da-caption accoda anche il media (`queueMedia` → `media_stage='pending'`) per la trascrizione. Solo yt senza transcript né caption oEmbed va dritto al worker. Scarica i documenti dal bucket Storage `documents` |
| `functions/generate/index.ts` | Cuore AI: OpenRouter (summary/tag/bucket) + OpenAI embedding → `ready`. Idempotente (riusata per la rigenerazione). Errori non fanno sparire l'item |
| `functions/search/index.ts` | Ricerca user-scoped: genera l'embedding query (OpenAI) e invoca la RPC `search_items` nel contesto utente (JWT → RLS). `verify_jwt=true` |
| `.env.example`, `config.toml`, `README.md` | Secrets (placeholder), config CLI (incl. `verify_jwt` per function), istruzioni + setup Vault |

Contratto con gli altri attori:
- **app → dispatch**: innescato dal trigger DB su `INSERT` di `items` via `pg_net` (+ sweep pg_cron); vedi `0005`.
- **app → search**: il client invoca la Edge Function `search` (JWT utente) → RPC ibrida.
- **worker → generate** / **dispatch → generate**: stesso ingresso, payload `{ item_id }` con `raw_content` pronto sull'item.

## `worker/` — estrazione media (Node + TypeScript)

| File | Ruolo |
|---|---|
| `src/index.ts` | Loop di polling: claim atomico `pending→processing`, orchestrazione, errori §7.7 (caption preservata su fallimento audio), cleanup. Rigenera via `generate` solo se l'item non è confermato (arricchimento, non sovrascrive le scelte utente) |
| `src/env.ts` | Validazione env (SUPABASE_URL, SERVICE_ROLE_KEY, OPENAI_API_KEY, POLL_INTERVAL_MS; cookie yt-dlp opzionali `YTDLP_COOKIES_FROM_BROWSER`/`YTDLP_COOKIES_FILE` per le fonti con login) |
| `src/supabase.ts` | Client service role |
| `src/types.ts` | Stati allineati a `app/src/types/domain.ts` (snake_case lato DB) |
| `src/rawContent.ts` | `composeRawContent()` puro: blocco [Caption]/[Autore]/[Trascrizione] (§7.5) |
| `src/extract/caption.ts` | Parser puri oEmbed TikTok / Open Graph IG / YouTube (fetch iniettabile) |
| `src/extract/media.ts` | **Estrazione media implementata** (Fase 6): `downloadAudio` (yt-dlp `-f bestaudio` + ffmpeg mono 16 kHz) e `transcribe` (Whisper `whisper-1`), con timeout e firme iniettabili per i test; `ytdlpCookieArgs()` per l'autenticazione delle fonti con login |
| `src/generate.ts` | Invoca la Edge Function `generate` (`{ item_id }`) dopo l'estrazione (anche su errore) |
| `Dockerfile` | Node 22 + ffmpeg + yt-dlp, non-root, nessuna porta esposta |

## `InfoBucket Design System/` — fonte di verità **visiva**

Componenti React **web** di riferimento + token CSS. **Non importato a runtime**:
i valori vivono in `app/src/theme/tokens.ts`. Se cambiano i `.css`, riallinea i token.

## `docs/`

`CODE_MAP.md` (questo), `RUN_LOCAL.md` (prova in locale), `DEPLOY.md` (function +
worker su VPS + cookie), `INSTALL_ANDROID.md` (APK su telefono).

---

## Confini per il lavoro parallelo (sub-agenti)

Cartelle isolate, basso accoppiamento: `supabase/` · `worker/` · `app/src/features/<feature>` · `docs/`.
I **contratti condivisi** che vanno tenuti coerenti a mano: enum di stato
(`types/domain.ts` ↔ migrations), payload `generate` (worker ↔ function), forma
della riga `items` (`mappers.ts` ↔ schema).

## Stato dei test

- `app/`: Jest — utility pure (`source`, `lifecycle`, `mappers`, `groupInbox`), repository (`items`,
  `items-mutations` incl. `archiveItem`, `buckets`), hook (`useInbox`, `useArchive`, `useSearch`,
  `useItemDetail`, `usePolling`, `useFocusRefetch`), auth (`AuthContext`), `ReviewScreen` (lettura/edit),
  libreria componenti UI (incl. `AvatarMenu`, `ListSkeleton`, `Toast`, `TranscriptSheet`,
  `ToastProvider`, `AccentPicker`, `Favicon`, `ScreenHeader`, `Wordmark`, rail + swipe di `ItemCard`),
  tema (`accent`, `themeStorage`, `scrim`, accento personalizzato persistito, `haptics`),
  schermata `add`, Libreria/dettaglio bucket, Impostazioni, BucketCard, motion.
  `npm test` → **168 verdi** (46 suite), `typecheck` e `lint` puliti.
  Dipendenze native aggiunte: `react-native-gesture-handler` (swipe) ed `expo-haptics`
  (feedback) — richiedono un rebuild del dev client / APK EAS, non solo Metro.
- `worker/`: Vitest — `composeRawContent`, parser caption, estrazione media
  (`media`, inclusi i cookie yt-dlp), validazione env (`env`), loop di polling
  (`index`). `npm test` → **57 verdi** (5 file).
- `supabase/functions/`: `deno test --no-check` — detection, validazione output modello,
  estrazione (article/document/youtube), **caption tiktok/reel/youtube** (oEmbed), text, fetch-remote, ai,
  parsing search. (Type-check completo solo sul runtime Deno di Supabase; in locale la
  config `lib` non copre il DOM di `extract-article`.)
