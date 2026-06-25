# Spec — InfoBucket (v2)

> App mobile personale (Android) per raccogliere informazioni da fonti diverse in un unico posto, farle riassumere / taggare / organizzare dall'AI e ritrovarle **per significato**. Documento pensato come input per Claude Code. Nome provvisorio, rinominabile.

**Cosa cambia rispetto alla v1:** un solo provider per la generazione (**OpenRouter**, modello a scelta e cambiabile), **trascrizione audio dei reel/TikTok/YouTube** già in v1 tramite un piccolo worker, target **solo Android** (niente più complessità Share Extension iOS), e un **design system** esterno come unica fonte di verità per lo stile.

---

## 1. Obiettivo e contesto

Il problema: le informazioni utili arrivano da fonti e punti diversi (articoli, video, reel, documenti) e si perdono perché non sono concentrate in un unico posto ricercabile.

La soluzione: un'app **mobile-first** (uso personale, singolo utente, Android) dove l'utente *condivide* un contenuto, l'AI lo elabora in background (riassunto + tag + bucket proposto), l'utente lo rivede con calma e lo conferma in un "bucket". Tutto diventa ricercabile **per significato**, non solo per parole chiave.

Il valore centrale è il **ritrovare**, non solo il salvare. La cattura deve essere a bassissimo attrito; la review è un momento separato e batch (es. la sera).

---

## 2. Principi e non-goal (v1)

Principi:
- **Human-in-the-loop**: l'AI propone (riassunto, tag, bucket), l'utente conferma con un tap. Niente azioni automatiche che modificano dati senza conferma.
- **Cattura leggera, elaborazione pesante lato server**: il telefono cattura il minimo e si chiude; tutto il lavoro avviene sul server, anche a telefono spento.
- **Rigenerazione a costo basso**: il contenuto grezzo estratto (testo articolo, trascrizione, caption) viene persistito, così rigenerare = una nuova chiamata AI, senza ri-scaricare la fonte.
- **Modello AI disaccoppiato**: la generazione passa da OpenRouter; il modello è una **variabile di configurazione**, non una dipendenza nel codice.
- **Stile centralizzato**: nessuno stile hardcoded nei componenti; tutto deriva dal design system (§13).

Non-goal espliciti per la v1 (NON implementare):
- Nessuna **azione esterna** (promemoria, todo, eventi calendario, integrazioni tipo ClickUp). La nota guida solo l'elaborazione *dell'elemento*.
- Nessun **OCR** sui frame dei video (niente vision). In v1 dai reel si estrae **audio→testo** e **caption**, non il testo scritto a schermo.
- Nessun **iOS**. Target unico: Android. (iOS è roadmap, §15.)
- Nessun **multi-utente**, ruoli, condivisione tra account.

---

## 3. Architettura del sistema

Tre attori, con responsabilità nette e interfacce chiare.

```
┌─────────────────────────────┐
│  App Android (Expo → APK)   │
│  • share intent: URL/file/  │
│    nota → scrive item       │
│    "processing" su Supabase │
│  • inbox, review, conferma  │
│    in bucket, ricerca       │
└──────────────┬──────────────┘
               │ (insert item)
               ▼
┌─────────────────────────────────────────────┐
│  Supabase  — il cervello, sempre attivo      │
│  • Postgres + pgvector (dati + ricerca sem.) │
│  • Auth (1 account), Storage (documenti)     │
│  • pg_cron (decadenza, §10)                  │
│  • Edge Functions (Deno):                    │
│      - dispatch  → instrada per tipo         │
│      - generate  → OpenRouter + embedding    │
│                    [CONDIVISA da tutti i tipi]│
└───────┬───────────────────────────┬──────────┘
        │ leggero                   │ "serve media"
        │ (article/document/        │ (reel/tiktok/
        │  youtube-con-transcript)  │  youtube-senza-transcript)
        ▼                           ▼
   estrazione                ┌──────────────────────────┐
   inline                    │  Worker — host economico  │
   nella Edge Function       │  (Railway/Fly/Hetzner)    │
        │                    │  • polla Supabase          │
        │                    │  • yt-dlp (scarica video)  │
        │                    │  • ffmpeg (estrae audio)   │
        │                    │  • Whisper API (STT)       │
        │                    │  • scrive raw_content      │
        │                    │    → chiama "generate"     │
        ▼                    └──────────────┬─────────────┘
   generate ◄─────────────────────────────┘
   (OpenRouter + embedding) → item "ready"
```

Principi di questa topologia:
- **La generazione vive in un posto solo** (`generate`): articoli e reel passano dalla stessa logica AI. Il worker fa *solo estrazione media*.
- **Il worker non è esposto a internet**: fa solo connessioni in uscita verso Supabase (polling) e verso le API. Niente porte aperte, niente webhook in ingresso da proteggere.
- **Tutto è resiliente al telefono spento**: l'app scrive una riga e si dimentica del resto.

---

## 4. Stack tecnico

- **Client**: Expo (React Native + TypeScript), distribuito come **APK via EAS Build** (cloud build di Expo, account gratuito). L'APK si installa direttamente sul telefono (sideload), **non serve il Play Store**. Aggiornare = ricompilare l'APK e reinstallarlo.
  - Lo share intent Android richiede una **dev/production build EAS**, non Expo Go (§12).
- **Backend / dati**: Supabase
  - Postgres come DB principale
  - **pgvector** per gli embedding e la ricerca semantica
  - Supabase Auth (un solo account personale)
  - Supabase Storage per i documenti caricati
  - **pg_cron** per il ciclo di vita / decadenza (§10)
  - **Edge Functions (Deno)** per `dispatch` e `generate`. Le chiavi API vivono SOLO qui e nel worker, mai nel client.
- **Worker**: un piccolo servizio always-on per scaricare e trascrivere i video.
  - Stack: Node **oppure** Python + `yt-dlp` + `ffmpeg`. STT via **API OpenAI Whisper** (`whisper-1`) → niente GPU necessaria.
  - **Hosting consigliato** (uso personale, costo minimo, processo che ogni tanto usa CPU e disco temporaneo):
    1. **Railway** o **Render** (background worker) — deploy da Git semplicissimo, tier economico, ottimo per iniziare. *Consigliato come primo passo.*
    2. **Fly.io** — `fly deploy`, scala a zero possibile, buon free allowance.
    3. **Hetzner CX22 (~4 €/mese)** — VPS pieno con Docker, massimo controllo, ottimo se in futuro vorrai aggiungere carichi.
  - Requisiti reali: `ffmpeg` installabile (tutti gli host sopra lo permettono), un po' di disco temporaneo per il file scaricato (poi cancellato), rete in uscita. Niente di pesante.
- **Modelli AI e chiavi** — **due sole API key**:
  - **Generazione** (riassunto, tag, suggerimento bucket): **OpenRouter**. Modello impostato via env (§14). **Default consigliato: `google/gemini-2.5-flash`** — economico, veloce, ottimo italiano, output JSON affidabile, non-Anthropic. Cambiabile con una riga (`OPENROUTER_MODEL`). Alternative valide: `openai/gpt-4o-mini`, `deepseek/deepseek-chat`.
  - **Embedding** (ricerca semantica): **OpenAI** `text-embedding-3-small` → `vector(1536)`.
  - **Trascrizione audio** (STT dei reel/video): **OpenAI** `whisper-1`. *Riusa la stessa chiave OpenAI degli embedding* — nessuna terza key.

> Nota: OpenRouter copre **solo** chat/completion, non offre endpoint di embedding né di trascrizione. Per questo embedding e STT passano da OpenAI. Totale chiavi: **OpenRouter + OpenAI = 2**.

---

## 5. Modello dati (schema Postgres)

Lo scheletro dell'app è la **macchina a stati** di ogni elemento:

`processing` → `ready` (in inbox, elaborato) → `saved` (confermato in un bucket, permanente) **oppure** `archived` (decaduto dall'inbox, recuperabile) → cancellato (hard delete).

A questa si affianca uno **stato di estrazione media** (`media_stage`), ortogonale: serve solo a coordinare app ↔ Edge Function ↔ worker durante l'elaborazione, e per i contenuti non-video resta `not_needed`.

```sql
-- Estensioni
create extension if not exists vector;
-- pg_cron va abilitato dal dashboard Supabase (Database > Extensions)

-- Bucket (creati dall'utente)
create table buckets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,                  -- usata dall'AI per il matching: descrivi cosa ci va dentro
  created_at  timestamptz not null default now()
);

create type item_status  as enum ('processing', 'ready', 'saved', 'archived');
create type source_type  as enum ('article', 'youtube', 'reel', 'tiktok', 'document', 'other');
-- stato della sotto-pipeline di estrazione media (download+STT) gestita dal worker
create type media_stage  as enum ('not_needed', 'pending', 'processing', 'done', 'error');

create table items (
  id                    uuid primary key default gen_random_uuid(),
  source_url            text,            -- null per i documenti caricati
  source_type           source_type not null default 'other',
  storage_path          text,            -- per documenti: path in Supabase Storage
  file_type             text,            -- es. 'application/pdf'
  raw_content           text,            -- grezzo estratto (testo articolo / caption + trascrizione), PERSISTITO per la rigenerazione
  note                  text,            -- nota utente (data alla condivisione o aggiunta in inbox)
  summary               text,            -- output AI
  tags                  text[] default '{}',          -- output AI
  suggested_bucket_id   uuid references buckets(id),  -- proposta AI: bucket esistente
  suggested_bucket_name text,            -- proposta AI: nome nuovo bucket (se nessuno calza)
  bucket_id             uuid references buckets(id),  -- impostato alla conferma
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

-- Ricerca per tag
create index idx_items_tags on items using gin (tags);

-- Ricerca semantica (HNSW, cosine)
create index idx_items_embedding on items using hnsw (embedding vector_cosine_ops);

-- Coda worker: trova in fretta gli item che aspettano estrazione media
create index idx_items_media_queue on items (media_stage) where media_stage = 'pending';

-- Ricerca keyword (full-text in italiano)
alter table items add column fts tsvector
  generated always as (
    to_tsvector('italian',
      coalesce(summary,'') || ' ' || coalesce(raw_content,'') || ' ' || coalesce(note,''))
  ) stored;
create index idx_items_fts on items using gin (fts);
```

Note sul modello:
- `tags` come `text[]` per semplicità (la v1 è personale). Si può normalizzare in `tags` + `item_tags` più avanti se serve un browsing per tag più ricco.
- `raw_content` è il pezzo chiave per la rigenerazione: **non va mai buttato** dopo la prima elaborazione. Per i reel ora contiene **caption + trascrizione** (etichettate), quindi non è più vuoto come nella v1.
- `tiktok` è ora un `source_type` distinto da `reel` (Instagram) perché il percorso di estrazione differisce leggermente (vedi §7). Concettualmente sono entrambi "video verticale breve".
- `media_stage` + `worker_claimed_at` formano una **coda minimale** senza tabelle extra: il worker seleziona `pending`, fa un update atomico a `processing` con `worker_claimed_at = now()`, lavora, poi `done`/`error`.

---

## 6. Pipeline di elaborazione (server)

**Innesco.** Quando un nuovo `item` viene inserito con `status = 'processing'`, parte la Edge Function `dispatch`. Innesco consigliato: **Database Webhook di Supabase** su `INSERT` di `items` → chiama `dispatch`. In più, un **sweep di sicurezza pg_cron** (ogni 1–2 min) raccoglie eventuali item rimasti `processing` non instradati (robustezza). Il telefono non deve restare attivo.

### 6.1 `dispatch` (Edge Function) — instradamento

1. **Determina `source_type`** dall'URL/contesto:
   - dominio `youtube.com`/`youtu.be` → `youtube`
   - dominio `tiktok.com` → `tiktok`
   - dominio `instagram.com` (reel/post) → `reel`
   - presenza di `storage_path` → `document`
   - altrimenti `article` (URL http) o `other`.
2. **Instrada**:
   - **Leggero** (`article`, `document`, e `youtube` con metadati pubblici): estrae `raw_content` **inline** nella Edge Function, poi chiama `generate`.
     - `article`: fetch pagina + estrazione testo leggibile (readability / HTML→testo).
     - `document`: estrae testo dal file in Storage (PDF e formati comuni).
     - `youtube`: ricava **titolo + descrizione + canale** via InnerTube (fallback pagina watch e oEmbed) e tenta il transcript pubblico. Se c'è il transcript, contenuto completo; altrimenti compone comunque titolo+descrizione (riassunto utile subito) e accoda l'audio al worker per la trascrizione. Va al percorso media solo se non si ottiene **nessun** metadato pubblico.
   - **Media** (`reel`, `tiktok`, e `youtube` senza alcun metadato pubblico): NON estrae nulla qui; imposta `media_stage = 'pending'` e termina. Ci penserà il worker (§7).

### 6.2 `generate` (Edge Function) — CONDIVISA, il cuore AI

Riceve un item con `raw_content` già pronto (qualunque sia la fonte) e:

3. **Chiama il modello via OpenRouter** con un prompt che include `raw_content` + `note` + l'elenco dei bucket esistenti (id, name, description). La nota è **guida**: può contenere contesto o istruzioni su come elaborare ("riassumi solo la parte X", "tira fuori i passaggi"). Resta confinata a questo elemento.
4. **Output strutturato (JSON)** atteso dal modello:

```json
{
  "summary": "riassunto conciso ma preciso del contenuto",
  "tags": ["tag1", "tag2", "tag3"],
  "bucket": {
    "match": "existing | new | none",
    "existing_id": "uuid del bucket esistente, oppure null",
    "new_name": "nome proposto per un nuovo bucket, oppure null"
  }
}
```

5. **Genera l'embedding** del contenuto (`summary` + `raw_content` + `note`) con OpenAI `text-embedding-3-small` e salvalo in `embedding`.
6. **Aggiorna l'item**: `summary`, `tags`, `suggested_bucket_id` / `suggested_bucket_name`, `processed_at = now()`, `status = 'ready'`. In caso di errore, salva `error` e lascia comunque l'item visibile in inbox (`status = 'ready'` con messaggio d'errore, così non sparisce nel nulla).

### 6.3 Rigenerazione

Endpoint/funzione che ri-esegue **solo** `generate` (passi 3→5) usando il `raw_content` GIÀ salvato + la `note` aggiornata. **Nessun nuovo download/fetch della fonte**, nessuna nuova trascrizione. Aggiorna summary/tag/bucket proposto + embedding.

---

## 7. Worker — estrazione media (reel / TikTok / YouTube senza transcript)

Servizio always-on, **a polling** (niente webhook in ingresso):

1. **Claim**: seleziona un item con `media_stage = 'pending'` e lo porta atomicamente a `media_stage = 'processing'`, `worker_claimed_at = now()` (un `update ... where media_stage='pending' returning *` evita doppie prese).
2. **Caption / metadati** (leggero, sempre tentato):
   - `tiktok`: endpoint **oEmbed** ufficiale (`https://www.tiktok.com/oembed?url=...`) → titolo/caption + autore + thumbnail. Affidabile e senza auth.
   - `reel` (Instagram): best-effort via **Open Graph** meta tag della pagina (`og:title`, `og:description`) ed eventuale oEmbed se disponibile. IG è più restrittivo: a volte si ottiene solo una parte. Se non si ottiene nulla, si prosegue: ci sono comunque audio e nota.
   - `youtube`: titolo + descrizione del video.
3. **Download + audio**: `yt-dlp` scarica lo stream, `ffmpeg` estrae una traccia audio compatta (es. mp3/m4a mono a basso bitrate, sufficiente per lo STT → file piccolo, upload veloce).
4. **Trascrizione**: invia l'audio all'API OpenAI **Whisper** (`whisper-1`) → testo del parlato.
5. **Compone `raw_content`** in modo etichettato e lo salva, es.:
   ```
   [Caption] come fare la pasta madre da zero...
   [Autore] @tizio
   [Trascrizione] Ciao a tutti oggi vi spiego come...
   ```
6. **Pulisce** il file temporaneo, imposta `media_stage = 'done'` e **chiama `generate`** (la stessa Edge Function del percorso leggero).
7. **Errori**: in caso di fallimento (download bloccato, video privato, ecc.) imposta `media_stage = 'error'` e `error`, **ma chiama `generate` lo stesso**: caption + nota possono bastare per un riassunto utile. Un reel senza audio utile resta comunque catturato con la tua nota.

Robustezza: un item rimasto in `media_stage = 'processing'` da troppo tempo (worker morto a metà) viene rimesso a `pending` da uno sweep pg_cron (timeout su `worker_claimed_at`).

---

## 8. Logica di suggerimento bucket (ibrida)

L'AI riceve l'elenco dei bucket esistenti (name + description) e il contenuto/nota, e restituisce:
- `match: "existing"` + `existing_id` → l'elemento calza in un bucket esistente.
- `match: "new"` + `new_name` → nessuno calza bene, propone di crearne uno nuovo.
- `match: "none"` → nessuna proposta (l'utente deciderà a mano).

Alla conferma in inbox:
- se l'utente accetta un bucket esistente → `bucket_id`, `status = 'saved'`, `confirmed_at = now()`.
- se accetta un nuovo bucket → crea prima la riga in `buckets`, poi imposta `bucket_id` e salva.

La qualità del suggerimento dipende dalle **description** dei bucket: l'utente è incoraggiato a descrivere bene cosa ci va dentro.

---

## 9. Inbox e review (UX)

**Schermata Inbox**: lista degli elementi non ancora confermati.
- elementi `processing`: mostra uno stato "in lavorazione" (per i reel: "sto trascrivendo…", guidato da `media_stage`).
- elementi `ready`: mostra titolo/fonte + anteprima riassunto + bucket proposto + tag.

**Dettaglio elemento** (alla conferma):
- riassunto (leggibile, modificabile),
- tag (modificabili: aggiungi/rimuovi),
- campo **nota** modificabile,
- pulsante **Rigenera** (ri-elabora tenendo conto della nota aggiornata, senza ri-scaricare),
- azione **Conferma**: accetta il bucket proposto, scegline un altro, o crea quello nuovo proposto,
- azione **Elimina**.
- per i reel/video: link alla fonte + (se presente) anteprima della trascrizione.

La conferma è il gesto che "salva" l'elemento e lo rende permanente.

---

## 10. Ciclo di vita / decadenza (pg_cron)

Job schedulato giornaliero lato server (indipendente dall'app aperta):
- elementi `status = 'ready'` (in inbox, non confermati) più vecchi di **7 giorni** da `created_at` → `status = 'archived'`, `archived_at = now()`.
- elementi `status = 'archived'` più vecchi di **20 giorni** da `archived_at` → **hard delete** (e rimozione dell'eventuale file da Storage).
- elementi `status = 'saved'` → **non decadono mai**.

Gli elementi `archived` restano **ricercabili e recuperabili**: durante i 20 giorni l'utente può ancora salvarli in un bucket (→ `saved`). L'archivio è una finestra di grazia, non un buco nero.

Sweep tecnici (oltre alla decadenza):
- item `processing` non instradati → re-innesca `dispatch` (rete di sicurezza per il webhook).
- item `media_stage = 'processing'` con `worker_claimed_at` troppo vecchio → rimetti a `pending`.

Opzionale (nice-to-have, non bloccante): una notifica/digest che avvisa quando ci sono elementi in inbox prossimi all'archiviazione.

---

## 11. Ricerca

Ricerca a **campo libero**, ibrida:
- **semantica**: si genera l'embedding della query (OpenAI) e si fa similarità vettoriale (cosine) su `items.embedding`.
- **keyword**: full-text Postgres (`fts`) su summary/raw_content/note.
- si **fondono e si ordinano** i risultati (es. reciprocal rank fusion o un semplice merge pesato). Opzionale: l'AI ri-ordina/sintetizza i top risultati ("ti propongo le cose più adatte").

Ambito: cerca tra `saved` e `archived` (non tra `processing`). Filtri opzionali per bucket e/o tag.

Implementazione consigliata: una **funzione Postgres** (`rpc`) che fa semantica + keyword + fusione lato DB e restituisce gli id ordinati — così il client fa una sola chiamata.

---

## 12. Cattura e condivisione (share Android) — la parte nativa

Su Android (target unico) la condivisione è molto più semplice che su iOS.

- **Ricezione dello share intent** `ACTION_SEND` (e `ACTION_SEND_MULTIPLE`) per URL, testo e file.
- Soluzione consigliata: libreria di share intent per Expo (es. `expo-share-intent`) o un config plugin. **Richiede EAS dev/production build** (non funziona in Expo Go).
- **Nota vocale**: non serve uno STT custom *per la nota*. La "nota a voce" è semplicemente la **dettatura della tastiera di sistema** dentro il campo nota. Tieni un semplice campo di testo. (Lo STT del §7 riguarda l'audio del *video*, non la nota.)
- Comportamento alla condivisione: l'app riceve l'intent, mostra un mini-form (contenuto rilevato + campo nota), scrive **una riga** in `items` (`status = 'processing'`) e si chiude. Il server fa tutto il resto. Tenere la cattura leggera è importante.

---

## 13. Design system (regola architetturale)

Il repo conterrà una cartella **`/design-system`** che è l'**unica fonte di verità** per l'aspetto dell'app. Regola vincolante:

> **Nessuno stile hardcoded nei componenti applicativi.** Colori, tipografia, spaziature, raggi, ombre e (se previsti) componenti base derivano tutti dal design system.

Per non legare il resto dell'app al formato (ancora da decidere), il frontend espone un **unico modulo adattatore** (es. `src/theme/index.ts`) che importa dal design system e ri-esporta un'interfaccia stabile (`theme.colors`, `theme.spacing`, `theme.typography`, eventuali componenti). Tutta l'app dipende **solo** da quell'adattatore.

Quando deciderai il formato della cartella, l'adattatore assorbe la scelta senza toccare le schermate. Formati possibili:
- **Design tokens** (JSON/JS): l'adattatore mappa i token sul tema.
- **NativeWind / Tailwind config**: l'adattatore espone il tema, i componenti usano le classi.
- **Libreria di componenti** già stilati: l'adattatore ri-esporta i componenti.

Finché la cartella non esiste, l'adattatore può contenere un set di valori provvisori, **chiaramente segnati come placeholder**, da sostituire con il design system reale.

---

## 14. Configurazione e segreti

**Chiavi/segreti — mai nel client.** Vivono nelle Edge Functions (secrets Supabase) e nel worker (env del servizio):

| Variabile | Dove | Uso |
|---|---|---|
| `OPENROUTER_API_KEY` | Edge Functions | generazione (summary/tag/bucket) |
| `OPENROUTER_MODEL` | Edge Functions | id modello, default `google/gemini-2.5-flash` |
| `OPENAI_API_KEY` | Edge Functions + Worker | embedding (`text-embedding-3-small`) e STT (`whisper-1`) |
| `SUPABASE_URL` | Worker | accesso al DB |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker + Edge Functions | scritture lato server (mai nel client) |

Il client Expo usa **solo** la `anon key` Supabase e l'auth dell'utente. Le RLS proteggono le tabelle; le scritture di pipeline usano la service role lato server.

Cambiare modello AI = cambiare `OPENROUTER_MODEL` e ridistribuire le Edge Functions. Nessuna modifica al codice.

---

## 15. Fuori scope v1 / roadmap futura

In ordine ragionevole di aggiunta dopo la v1:
1. **Azioni** come *suggerimenti confermabili in inbox* (stesso pattern del bucket): l'AI propone un'azione strutturata (es. promemoria), l'utente conferma. Partire dal promemoria locale (notifiche Expo, autosufficiente). Poi eventualmente todo/eventi verso ClickUp / Google Calendar (ognuno è un'integrazione a sé con OAuth).
2. **OCR sui frame** dei reel (testo a schermo) ad arricchire la trascrizione audio già presente.
3. **iOS** (Share Extension dedicata) se servisse un secondo dispositivo.
4. Tag normalizzati, browsing avanzato, digest periodici.

---

## 16. Ordine di sviluppo consigliato

Pensato per avere presto un **loop funzionante** prima di affrontare la parte nativa e il worker.

- **Fase 0** — Progetto Supabase: schema (§5), Auth, Storage, estensioni (vector, pg_cron), secrets.
- **Fase 1** — Skeleton app Expo + login + **"aggiungi elemento incollando un URL"** (manuale, prima dello share intent) + lista Inbox. (Già qui si installa un APK di prova sul telefono.)
- **Fase 2** — `generate` (Edge Function): OpenRouter + embedding. Poi `dispatch` per il percorso **leggero** (articoli e documenti).
- **Fase 3** — Dettaglio/review: conferma in bucket, modifica tag, nota, **rigenera**.
- **Fase 4** — Ricerca ibrida (semantica + keyword) via RPC.
- **Fase 5** — Cron di decadenza (inbox → archivio → cancellazione) + sweep di robustezza.
- **Fase 6** — **Worker** reel/TikTok/YouTube: polling + yt-dlp + ffmpeg + Whisper + caption → `generate`. Deploy su host economico.
- **Fase 7** — **Share intent Android** nativo (EAS build). Fino a qui l'aggiunta-via-incolla copre il flusso.
- **Fase 8 (post-v1)** — azioni, OCR, eventuale iOS.

Il **design system** (§13) non è una fase a sé: l'adattatore tema esiste dalla Fase 1 con placeholder e viene riempito appena la cartella `/design-system` è pronta.

---

## 17. Note tecniche e cose da verificare

- **Chiavi API solo lato server** (Edge Functions + worker). Mai nel client Expo. Service role solo lato server.
- **Due provider**: OpenRouter = generazione; OpenAI = embedding + STT. OpenRouter **non** fa embedding/STT. Allinea `vector(1536)` al modello di embedding scelto.
- **Modello via env**: `OPENROUTER_MODEL`. Verifica l'**id esatto e corrente** del modello su OpenRouter (gli id cambiano; `google/gemini-2.5-flash` è il default proposto, controlla disponibilità/versione).
- **Costi e rate limit**: trascurabili per uso personale (generazione su modello flash + embedding small + qualche minuto di Whisper).
- **Verifica le versioni/API correnti** delle librerie citate (in particolare `expo-share-intent`, `yt-dlp`, l'estrazione transcript YouTube e gli oEmbed TikTok/Instagram): le interfacce cambiano spesso e questa spec descrive l'intento, non l'API esatta.
- **Instagram è il caso più fragile** per i metadati: progetta il worker perché degradi con grazia (caption mancante → si usano audio + nota; audio mancante → si usa solo la nota).
- **Estrazione articoli/documenti** in Edge Functions (Deno) via fetch + parsing; se un caso risultasse troppo pesante, spostalo sul worker (che è già lì).
- **APK e installazione**: abilitare "installa da fonti sconosciute" sul telefono per il sideload del primo APK; le build successive si reinstallano sopra.
