# Mappa del codice — InfoBucket

Mappa di moduli, dipendenze e relazioni. Serve a capire **gli impatti di una
modifica** prima di farla. Aggiornala a ogni cambiamento strutturale (regola
in `CLAUDE.md` §6).

> Stato: **Fase 1 completata** (login + aggiungi-via-URL + Inbox, con libreria UI
> RN del design system). Le Edge Functions e il worker sono scaffold strutturati
> con stub `// TODO Fase 2/6`; lo schema DB e i contratti condivisi sono completi.
> La generazione AI (summary/tag/bucket) entra in Fase 2.

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
| `src/theme/tokens.ts` | Valori grezzi del design system (colori light/dark, accenti, type, spacing, radii, shadow). Porting dei `.css` | — |
| `src/theme/index.ts` | **Adapter del tema**: `ThemeProvider`, `useTheme`, `useThemeControls`, `sourceColor()`. UNICO punto che l'app conosce per lo stile | `tokens.ts`, `types/domain.ts` |
| `src/theme/icons.tsx` | Icone (wrapper `lucide-react-native`, default coerenti) + `SOURCE_ICON` | `types/domain.ts` |
| `src/theme/components/*` | **Libreria UI** (RN) del design system: Button, TextField, NoteField, SourceStamp, StatusBadge, Tag, BucketChip, ItemCard, EmptyState, ErrorBanner, AddButton. Stile solo da `useTheme()` | `@/theme`, `icons` |
| `src/lib/env.ts` | Legge/valida `EXPO_PUBLIC_*` (solo URL + anon key, nessun segreto) | — |
| `src/lib/supabase.ts` | Client Supabase (anon key + auth, AsyncStorage) | `env.ts` |
| `src/lib/mappers.ts` | Mapping righe DB snake_case ↔ tipi di dominio camelCase | `types/domain.ts` |
| `src/lib/source.ts` | Rilevamento `SourceType` da URL + validazione URL (logica pura) | `types/domain.ts` |
| `src/lib/lifecycle.ts` | Countdown decadenza lato client (giorni all'archivio/cancellazione) | `types/domain.ts` |
| `src/lib/items.ts` | **Repository `items`**: `listInbox`, `addItemByUrl` (valida URL, rileva source) | `supabase`, `mappers`, `source` |
| `src/features/auth/` | `AuthProvider` + `useAuth` (email/password Supabase, sessione persistita, errori in italiano) | `@/lib/supabase` |
| `src/features/inbox/useInbox.ts` | Stato Inbox (loading/error/refetch) | `@/lib/items` |

**Schermate (`app/app/`, expo-router file-based):**

| Route | File | Ruolo |
|---|---|---|
| `_layout` | `app/_layout.tsx` | Carica font, monta `ThemeProvider`+`AuthProvider`, **auth-gate** (redirect login↔app) |
| `/login` | `app/login.tsx` | Accesso/registrazione (usa `useAuth`, `Button`, `TextField`, `ErrorBanner`) |
| `/` (tab) | `app/(tabs)/index.tsx` | **Inbox**: lista `ItemCard`, pull-to-refresh, FAB → /add, stato vuoto/errore |
| tab | `app/(tabs)/library.tsx`, `search.tsx` | Placeholder (Fase 4+) |
| `/add` | `app/add.tsx` | Modale **Aggiungi-URL** (usa `addItemByUrl`, `TextField`, `NoteField`) |

**Regola di dipendenza:** le schermate (`app/app/*`, `src/features/*`) importano **solo**
da `@/theme`(+`/components`,`/icons`), `@/types`, `@/lib`, `@/features`. Mai i token
grezzi, mai i nomi delle colonne DB.

Impatti tipici:
- Cambi un colore/spaziatura → `tokens.ts` (adapter, componenti e schermate non cambiano).
- Cambi un componente UI → `src/theme/components/` (le schermate lo riusano).
- Cambi un enum di stato → aggiorna **insieme** `types/domain.ts` e la migration SQL.
- Cambi nomi colonna DB → solo `mappers.ts` (+ migration).
- Cambi forma query `items` → solo `src/lib/items.ts`.

## `supabase/` — backend (il cervello)

| File | Ruolo |
|---|---|
| `migrations/0001_init.sql` | Estensioni, enum, tabelle `buckets`/`items` (+`user_id`), indici (gin tags, hnsw embedding, parziale media-queue, gin fts) |
| `migrations/0002_rls.sql` | RLS su entrambe le tabelle, policy `user_id = auth.uid()`; service role bypassa |
| `migrations/0003_search.sql` | RPC `search_items()` — ricerca ibrida (semantica + full-text) con fusione RRF |
| `migrations/0004_cron.sql` | Job pg_cron: ready>7gg→archived, archived>20gg→delete, sweep claim media bloccati |
| `functions/_shared/source-type.ts` | Rilevamento `source_type` (autorevole, lato server) — gemello puro di `app/src/lib/source.ts` |
| `functions/_shared/model-output.ts` | Parsing/validazione dell'output JSON del modello (input **non fidato**) |
| `functions/_shared/{cors,supabase}.ts` | Helper CORS + client service role |
| `functions/dispatch/index.ts` | Instrada un item: leggero (article/document/yt-transcript) vs media (`media_stage='pending'`). `// TODO Fase 2` per estrazione |
| `functions/generate/index.ts` | Cuore AI: OpenRouter (summary/tag/bucket) + OpenAI embedding → `ready`. Errori non fanno sparire l'item. `// TODO Fase 2` |
| `.env.example`, `config.toml`, `README.md` | Secrets (placeholder), config CLI, istruzioni |

Contratto con gli altri attori:
- **app → dispatch**: innescato da Database Webhook su `INSERT` di `items` (+ sweep pg_cron).
- **worker → generate** / **dispatch → generate**: stesso ingresso, payload item con `raw_content` pronto.

## `worker/` — estrazione media (Node + TypeScript)

| File | Ruolo |
|---|---|
| `src/index.ts` | Loop di polling: claim atomico `pending→processing`, orchestrazione, errori §7.7, cleanup |
| `src/env.ts` | Validazione env (SUPABASE_URL, SERVICE_ROLE_KEY, OPENAI_API_KEY, POLL_INTERVAL_MS) |
| `src/supabase.ts` | Client service role |
| `src/types.ts` | Stati allineati a `app/src/types/domain.ts` (snake_case lato DB) |
| `src/rawContent.ts` | `composeRawContent()` puro: blocco [Caption]/[Autore]/[Trascrizione] (§7.5) |
| `src/extract/caption.ts` | Parser puri oEmbed TikTok / Open Graph IG / YouTube (fetch iniettabile) |
| `src/extract/media.ts` | Stub `downloadAudio` (yt-dlp+ffmpeg) + `transcribe` (Whisper). `// TODO Fase 6` |
| `src/generate.ts` | Invoca la Edge Function `generate` dopo l'estrazione (anche su errore) |
| `Dockerfile` | Node 22 + ffmpeg + yt-dlp, non-root, nessuna porta esposta |

> **Da allineare in Fase 6:** il payload verso `generate` (worker assume `{ item_id }`).

## `InfoBucket Design System/` — fonte di verità **visiva**

Componenti React **web** di riferimento + token CSS. **Non importato a runtime**:
i valori vivono in `app/src/theme/tokens.ts`. Se cambiano i `.css`, riallinea i token.

## `docs/`

`CODE_MAP.md` (questo), `RUN_LOCAL.md` (prova in locale), `INSTALL_ANDROID.md` (APK su telefono).

---

## Confini per il lavoro parallelo (sub-agenti)

Cartelle isolate, basso accoppiamento: `supabase/` · `worker/` · `app/src/features/<feature>` · `docs/`.
I **contratti condivisi** che vanno tenuti coerenti a mano: enum di stato
(`types/domain.ts` ↔ migrations), payload `generate` (worker ↔ function), forma
della riga `items` (`mappers.ts` ↔ schema).

## Stato dei test

- `app/`: Jest — utility pure (`source`, `lifecycle`, `mappers`), repository (`items`),
  hook (`useInbox`), auth (`AuthContext`), libreria componenti UI, schermata `add`.
  `npm test` → **69 verdi**, `typecheck` e `lint` puliti.
- `worker/`: Vitest — `composeRawContent`, parser caption. `npm test` → verde (21).
- `supabase/functions/`: `deno test` — detection + validazione output modello (da eseguire sul cloud/Deno).
