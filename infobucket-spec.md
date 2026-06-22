# Spec — infobucket (v1)

> App mobile personale per raccogliere informazioni da fonti diverse in un unico posto, farle riassumere/taggare/organizzare dall'AI e ritrovarle per significato. Documento pensato come input per Claude Code. Nome provvisorio, rinominabile.

---

## 1. Obiettivo e contesto

Il problema da risolvere: le informazioni utili arrivano da fonti e punti diversi (articoli, video, documenti) e si perdono perché non sono concentrate in un unico posto ricercabile.

La soluzione: un'app **mobile-first** (uso personale, singolo utente) dove l'utente *condivide* un contenuto, l'AI lo elabora in background (riassunto + tag + bucket proposto), l'utente lo rivede con calma e lo conferma in un "bucket". Tutto diventa ricercabile per significato, non solo per parole chiave.

Il valore centrale è il **ritrovare**, non solo il salvare. La cattura deve essere a bassissimo attrito; la review è un momento separato e batch (es. la sera).

---

## 2. Principi e non-goal (v1)

Principi:
- **Human-in-the-loop**: l'AI propone (riassunto, tag, bucket), l'utente conferma con un tap. Niente azioni automatiche che modificano dati senza conferma.
- **Niente scraping fragile in v1**: si estrae davvero solo da fonti affidabili (articoli web, documenti). Per i social il contenuto è guidato dalla nota dell'utente (vedi §3 e §5).
- **Rigenerazione a costo basso**: il contenuto grezzo estratto viene persistito, così rigenerare = una nuova chiamata AI, senza ri-scaricare la fonte.

Non-goal espliciti per la v1 (NON implementare):
- Nessuna **azione esterna** (promemoria, todo, eventi calendario, integrazioni tipo ClickUp). La nota guida solo l'elaborazione *dell'elemento*.
- Nessuna **trascrizione audio/OCR** dei reel (niente Whisper, niente vision).
- Nessun **multi-utente**, ruoli, condivisione tra account.

Questi punti sono roadmap futura (§11), non v1.

---

## 3. Stack tecnico

- **Client**: Expo (React Native + TypeScript). Serve un **EAS dev build**, NON Expo Go, perché la condivisione richiede share intent / share extension nativi (§10).
- **Backend / dati**: Supabase
  - Postgres come DB principale
  - **pgvector** per gli embedding e la ricerca semantica
  - Supabase Auth (un solo account personale)
  - Supabase Storage per i documenti caricati
  - **pg_cron** per il ciclo di vita / decadenza (§8)
- **Elaborazione lato server**: Supabase Edge Functions (Deno). Sufficienti per la v1, perché la v1 non fa estrazione media pesante. Le chiavi API vivono SOLO qui, mai nel client.
- **Modelli AI**:
  - Generazione (riassunto, tag, suggerimento bucket): **Anthropic Claude** (es. un modello Sonnet/Haiku via API).
  - Embedding: provider separato — **Anthropic non offre un endpoint di embedding**. Usare es. **Voyage AI** (consigliato da Anthropic) oppure OpenAI `text-embedding-3-small`. La dimensione della colonna `vector` deve combaciare col modello scelto.

---

## 4. Modello dati (schema Postgres)

Lo scheletro dell'app è la **macchina a stati** di ogni elemento:

`processing` → `ready` (in inbox, elaborato) → `saved` (confermato in un bucket, permanente) **oppure** `archived` (decaduto dall'inbox, recuperabile) → cancellato (hard delete).

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

create type item_status as enum ('processing', 'ready', 'saved', 'archived');
create type source_type as enum ('article', 'youtube', 'reel', 'document', 'other');

create table items (
  id                   uuid primary key default gen_random_uuid(),
  source_url           text,            -- null per i documenti caricati
  source_type          source_type not null default 'other',
  storage_path         text,            -- per documenti: path in Supabase Storage
  file_type            text,            -- es. 'application/pdf'
  raw_content          text,            -- contenuto grezzo estratto, PERSISTITO per la rigenerazione
  note                 text,            -- nota utente (data alla condivisione o aggiunta in inbox)
  summary              text,            -- output AI
  tags                 text[] default '{}',  -- output AI
  suggested_bucket_id  uuid references buckets(id),  -- proposta AI: bucket esistente
  suggested_bucket_name text,           -- proposta AI: nome nuovo bucket (se nessuno calza)
  bucket_id            uuid references buckets(id),  -- impostato alla conferma
  status               item_status not null default 'processing',
  embedding            vector(1536),    -- = dimensione del modello di embedding scelto (adatta se usi Voyage)
  error                text,            -- eventuale messaggio di errore di elaborazione
  created_at           timestamptz not null default now(),
  processed_at         timestamptz,
  confirmed_at         timestamptz,
  archived_at          timestamptz
);

-- Ricerca per tag
create index idx_items_tags on items using gin (tags);

-- Ricerca semantica (scegli un tipo di indice pgvector: ivfflat o hnsw)
create index idx_items_embedding on items using hnsw (embedding vector_cosine_ops);

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
- `raw_content` è il pezzo chiave per la rigenerazione: **non va mai buttato** dopo la prima elaborazione. Per i reel sarà spesso povero o vuoto: nota + URL sono tutto ciò che si avrà.

---

## 5. Pipeline di elaborazione (server)

Innesco: quando un nuovo `item` viene inserito con `status = 'processing'` (dalla condivisione), una Edge Function lo elabora in asincrono. Il telefono non deve restare attivo.

Passi:
1. **Determina `source_type`** dall'URL (dominio youtube → `youtube`; tiktok/instagram → `reel`; presenza di `storage_path` → `document`; altrimenti `article`/`other`).
2. **Estrai `raw_content`**:
   - `article`: fetch della pagina + estrazione del testo leggibile (readability / HTML→testo).
   - `document`: estrai testo dal file in Storage (PDF e formati comuni).
   - `youtube`: prova a recuperare il transcript; se non disponibile, lascia `raw_content` vuoto e affidati alla nota.
   - `reel`: best-effort. In v1 di norma nessuna estrazione affidabile → `raw_content` resta vuoto, il senso lo dà la **nota**.
3. **Chiama Claude** con un prompt che include `raw_content` + `note` + l'elenco dei bucket esistenti (id, name, description). La nota va trattata come **guida**: può contenere contesto o istruzioni su come elaborare ("riassumi solo la parte X", "tira fuori i passaggi"). Resta confinata all'elaborazione di questo elemento.
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

5. **Genera l'embedding** del contenuto (summary + raw_content + note) col provider scelto e salvalo in `embedding`.
6. Aggiorna l'item: `summary`, `tags`, `suggested_bucket_id` / `suggested_bucket_name`, `processed_at = now()`, `status = 'ready'`. In caso di errore, salva `error` e lascia comunque l'item visibile in inbox.

**Rigenerazione**: endpoint/funzione che ri-esegue i passi 3→5 usando il `raw_content` GIÀ salvato + la `note` aggiornata. Nessun nuovo fetch della fonte. Aggiorna summary/tag/bucket proposto + embedding.

---

## 6. Logica di suggerimento bucket (ibrida)

L'AI riceve l'elenco dei bucket esistenti (name + description) e il contenuto/nota, e restituisce:
- `match: "existing"` + `existing_id` → l'elemento calza in un bucket esistente.
- `match: "new"` + `new_name` → nessuno calza bene, propone di crearne uno nuovo.
- `match: "none"` → nessuna proposta (l'utente deciderà a mano).

Alla conferma in inbox:
- se l'utente accetta un bucket esistente → `bucket_id`, `status = 'saved'`, `confirmed_at = now()`.
- se accetta un nuovo bucket → crea prima la riga in `buckets`, poi imposta `bucket_id` e salva.

La qualità del suggerimento dipende dalle **description** dei bucket: l'utente è incoraggiato a descrivere bene cosa ci va dentro.

---

## 7. Inbox e review (UX)

**Schermata Inbox**: lista degli elementi non ancora confermati.
- elementi `processing`: mostra uno stato "in lavorazione".
- elementi `ready`: mostra titolo/fonte + anteprima riassunto + bucket proposto + tag.

**Dettaglio elemento** (alla conferma):
- riassunto (leggibile, modificabile se vuoi),
- tag (modificabili: aggiungi/rimuovi),
- campo **nota** modificabile,
- pulsante **Rigenera** (ri-elabora tenendo conto della nota aggiornata),
- azione **Conferma**: accetta il bucket proposto, scegline un altro, o crea quello nuovo proposto,
- azione **Elimina**.

La conferma è il gesto che "salva" l'elemento e lo rende permanente.

---

## 8. Ciclo di vita / decadenza (pg_cron)

Job schedulato giornaliero lato server (indipendente dall'app aperta):
- elementi `status = 'ready'` (in inbox, non confermati) più vecchi di **7 giorni** da `created_at` → `status = 'archived'`, `archived_at = now()`.
- elementi `status = 'archived'` più vecchi di **20 giorni** da `archived_at` → **hard delete** (e rimozione dell'eventuale file da Storage).
- elementi `status = 'saved'` → **non decadono mai**.

Gli elementi `archived` restano **ricercabili e recuperabili**: durante i 20 giorni l'utente può ancora salvarli in un bucket (→ `saved`). L'archivio è una finestra di grazia, non un buco nero.

Opzionale (nice-to-have, non bloccante): una notifica/digest che avvisa quando ci sono elementi in inbox prossimi all'archiviazione.

---

## 9. Ricerca

Ricerca a **campo libero**, ibrida:
- **semantica**: si genera l'embedding della query e si fa similarità vettoriale (cosine) su `items.embedding`.
- **keyword**: full-text Postgres (`fts`) su summary/raw_content/note.
- si **fondono e si ordinano** i risultati (es. reciprocal rank fusion o un semplice merge pesato). Opzionale: l'AI ri-ordina/sintetizza i top risultati ("ti propongo le cose più adatte").

Ambito: cerca tra `saved` e `archived` (non tra `processing`). Filtri opzionali per bucket e/o tag.

---

## 10. Cattura e condivisione (share) — la parte nativa

È il pezzo più delicato e va affrontato per ultimo (§12).

- **Android**: ricezione dello share intent (`ACTION_SEND`) per URL/testo/file.
- **iOS**: **Share Extension** dedicata.
- Soluzione consigliata: una libreria di share intent (es. `expo-share-intent`) o un config plugin custom. **Richiede EAS dev build** (non funziona in Expo Go).
- **Nota vocale**: non serve uno STT custom. La "nota a voce" è semplicemente la **dettatura della tastiera di sistema** dentro il campo nota. Tieni un semplice campo di testo.
- Comportamento alla condivisione: l'estensione fa il **minimo** — cattura URL/file + eventuale nota e scrive una riga in `items` (`status = 'processing'`), poi si chiude. Il server fa tutto il resto. Mantenere l'estensione leggera è importante (su iOS ha limiti di tempo/memoria).

---

## 11. Fuori scope v1 / roadmap futura

In ordine ragionevole di aggiunta dopo la v1:
1. **Azioni** come *suggerimenti confermabili in inbox* (stesso pattern del bucket): l'AI propone un'azione strutturata (es. promemoria), l'utente conferma. Partire dal promemoria locale (notifiche Expo, autosufficiente, niente integrazioni). Poi eventualmente todo/eventi verso ClickUp / Google Calendar (ognuno è un'integrazione a sé con OAuth).
2. **Reel best-effort "vero"**: modulo separato che scarica l'audio → speech-to-text, eventualmente OCR sui frame. Worker dedicato (non Edge Function) — la VPS esistente può ospitarlo.
3. Tag normalizzati, browsing avanzato, digest periodici.

---

## 12. Ordine di sviluppo consigliato

Pensato per avere presto un **loop funzionante** prima di combattere con la parte nativa:

- **Fase 0** — Progetto Supabase: schema (§4), Auth, Storage, estensioni (vector, pg_cron).
- **Fase 1** — Skeleton app Expo + login + **"aggiungi elemento incollando un URL"** (manuale, prima dello share extension) + lista Inbox.
- **Fase 2** — Pipeline server (Edge Function): estrazione + chiamata Claude + embedding, partendo da **articoli e documenti** (le fonti affidabili).
- **Fase 3** — Dettaglio/review: conferma in bucket, modifica tag, nota, **rigenera**.
- **Fase 4** — Ricerca ibrida (semantica + keyword).
- **Fase 5** — Cron di decadenza (inbox → archivio → cancellazione).
- **Fase 6** — Share intent/extension nativo (EAS dev build). Fino a qui l'aggiunta-via-incolla copre il flusso.
- **Fase 7 (post-v1)** — reel best-effort, poi azioni.

---

## 13. Note tecniche e cose da verificare

- **Chiavi API solo lato server** (Edge Functions). Mai nel client Expo. Usa la service role solo nelle funzioni.
- **Anthropic = generazione**, embedding da provider separato (Voyage o OpenAI). Allinea `vector(N)` al modello scelto.
- **Costi e rate limit**: trascurabili per uso personale.
- **Verifica le versioni/API correnti** delle librerie citate (in particolare la soluzione di share intent per Expo e l'estrazione transcript YouTube): le interfacce cambiano spesso e questa spec descrive l'intento, non l'API esatta.
- L'estrazione articoli e il parsing documenti in Edge Functions (Deno) sono fattibili via fetch + parsing; se un caso risultasse troppo pesante per le Edge Functions, spostarlo su un piccolo worker esterno (la VPS).
