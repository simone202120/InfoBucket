# Come scaricare e provare InfoBucket in locale

Guida passo-passo per scaricare il progetto, collegarlo a un tuo progetto Supabase
e avviare l'app sul telefono (Expo Go) o su un emulatore Android.

> InfoBucket è un'app personale, per un solo utente. Questa guida copre
> l'avvio **in locale per provarla**. Per installare un'app vera e propria sul
> telefono (APK) vedi **[INSTALL_ANDROID.md](INSTALL_ANDROID.md)**.

---

## 0. In breve (per chi va di fretta)

```bash
# 1. Scarica il codice
git clone <URL-DEL-REPO> InfoBucket
cd InfoBucket/app

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili pubbliche (URL + anon key Supabase)
cp .env.example .env
#   poi apri .env e incolla i tuoi valori (vedi §4)

# 4. Avvia
npm start
#   scansiona il QR con l'app Expo Go sul telefono
```

I passi qui sotto spiegano ognuno di questi punti in dettaglio, **incluso come
creare il progetto Supabase** (passo 3), che è il prerequisito vero.

---

## 1. Prerequisiti

Installa questi strumenti **sul computer**:

| Cosa | Versione | Note |
|---|---|---|
| **Node.js** | **22 LTS** | Scaricalo da <https://nodejs.org>. Verifica con `node -v` |
| **npm** | quello incluso con Node 22 | Verifica con `npm -v` |
| **Git** | qualunque recente | Verifica con `git --version` |

Per **vedere l'app girare** scegli **una** di queste due strade:

- **Telefono (consigliato, più semplice):** installa l'app **Expo Go** dal Play
  Store sul tuo Android. Computer e telefono devono stare sulla **stessa rete
  Wi-Fi**.
- **Emulatore Android** sul computer: Android Studio con un emulatore (AVD)
  configurato. Più pesante da installare; usalo solo se non vuoi usare il telefono.

Ti serviranno inoltre, **quando arriverai ai passi server**:

- un account **Supabase** gratuito (<https://supabase.com>) — passo 3;
- più avanti, una **chiave OpenRouter** e una **chiave OpenAI** per far funzionare
  l'AI (riassunti, tag, ricerca). **Non servono per il primo avvio dell'app**: le
  imposti solo quando vuoi provare l'elaborazione AI lato server (§6).

Verifica rapida:

```bash
node -v   # deve stampare v22.x
npm -v
git --version
```

---

## 2. Scaricare il repo e installare le dipendenze

```bash
git clone <URL-DEL-REPO> InfoBucket
cd InfoBucket/app
npm install
```

> **Importante:** i comandi dell'app si lanciano **dentro la cartella `app/`**,
> non dalla radice del monorepo. La radice contiene anche `supabase/` e `worker/`,
> che hanno un loro ciclo di vita.

---

## 3. Creare il progetto Supabase

Supabase è "il cervello" dell'app: database, autenticazione e funzioni server.
Ne serve uno tuo.

### 3.1 Crea il progetto

1. Vai su <https://supabase.com> e accedi (registrazione gratuita).
2. **New project** → scegli un'organizzazione (o creane una), dai un **nome**
   (es. `infobucket`), imposta una **Database Password** (salvala: serve per la
   CLI e per le connessioni dirette) e scegli la **Region** più vicina a te.
3. Crea e aspetta qualche minuto che il progetto sia pronto.

### 3.2 Abilita le estensioni (vector e pg_cron)

Dal dashboard del progetto: **Database → Extensions**. Cerca e abilita:

- **`vector`** (pgvector) — serve per la ricerca semantica;
- **`pg_cron`** — serve per i job di decadenza/manutenzione.

> L'estensione `vector` viene comunque richiesta anche dalla prima migration
> (`create extension if not exists vector;`), ma abilitarla qui evita sorprese.
> `pg_cron` invece **va abilitato dal dashboard**: non sempre si attiva via SQL.

### 3.3 Applica le migrations

Lo schema del database (tabelle, indici, RLS, funzioni di ricerca, cron) vive in
`supabase/migrations/`. I file sono numerati e vanno applicati **in ordine**:

```
supabase/migrations/0001_init.sql     # estensioni, tabelle, tipi enum, indici
supabase/migrations/0002_rls.sql      # Row Level Security
supabase/migrations/0003_search.sql   # funzioni di ricerca (RPC)
supabase/migrations/0004_cron.sql     # job pg_cron (decadenza + sweep)
```

> Nota: i nomi/numeri sopra riflettono lo stato attuale del repo. Se trovi altri
> file in `supabase/migrations/`, applicali comunque **in ordine numerico
> crescente**. La cartella `supabase/` è in evoluzione.

Hai due modi per applicarle. Scegline **uno**.

#### Opzione A — Copia-incolla nel SQL Editor (zero installazioni)

La via più semplice per un singolo utente.

1. Dashboard Supabase → **SQL Editor** → **New query**.
2. Apri il file `supabase/migrations/0001_init.sql`, copia **tutto** il contenuto,
   incollalo nell'editor e premi **Run**.
3. Ripeti per `0002_rls.sql`, poi `0003_search.sql`, poi `0004_cron.sql`,
   **uno alla volta e nell'ordine**.
4. Se una query dà errore, leggi il messaggio: spesso è una estensione non
   abilitata (torna al §3.2) o un file applicato fuori ordine.

#### Opzione B — Supabase CLI (più ordinato, ripetibile)

Richiede di installare la CLI ma è più comodo se rifarai l'operazione.

```bash
# Installa la CLI (una volta sola). Vedi https://supabase.com/docs/guides/cli
npm install -g supabase

# Dalla RADICE del repo (dove c'è la cartella supabase/)
cd /percorso/di/InfoBucket

# Collega la CLI al tuo progetto cloud (ref = parte iniziale dell'URL del progetto)
supabase login            # apre il browser per autenticarti
supabase link --project-ref <project-ref>

# Applica le migrations al database remoto
supabase db push
```

> Il `<project-ref>` è la parte prima di `.supabase.co` nell'URL del progetto
> (es. in `https://abcd1234.supabase.co` il ref è `abcd1234`). Lo trovi anche in
> **Project Settings → General**.

### 3.4 Crea il tuo utente

L'app richiede il login (un solo account personale). Dal dashboard:
**Authentication → Users → Add user** → crea un utente con **email e password**
(puoi usare la tua email). Userai queste credenziali per accedere nell'app.

> Se preferisci, puoi anche registrarti dalla schermata di login dell'app, a
> seconda di com'è configurata l'autenticazione. In caso di dubbio, creare
> l'utente a mano dal dashboard è il modo più sicuro per partire.

---

## 4. Compilare `app/.env`

Il client Expo ha bisogno di **due soli valori pubblici**: l'URL del progetto e
la **anon key** (è pubblica per design, protetta dalle RLS).

1. Dal dashboard: **Project Settings → API**.
   - **Project URL** → è `EXPO_PUBLIC_SUPABASE_URL`.
   - **Project API keys → `anon` `public`** → è `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. Crea il file `.env` partendo dall'esempio:

```bash
cd app
cp .env.example .env
```

3. Apri `app/.env` e incolla i tuoi valori:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://il-tuo-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=la-tua-anon-public-key
```

> ⚠️ **Mai** mettere qui chiavi AI (OpenRouter/OpenAI) o la `service_role` key.
> Tutto ciò che inizia con `EXPO_PUBLIC_` finisce dentro l'app installata ed è
> quindi **leggibile**: vanno bene solo URL e anon key. I segreti veri stanno
> lato server (vedi §6).

---

## 5. Avviare l'app

Dentro `app/`:

```bash
npm start
```

Si apre il **dev server Expo** e mostra un **QR code** nel terminale.

- **Con il telefono:** apri **Expo Go** → "Scan QR code" → inquadra il QR. L'app
  si carica sul telefono. (Telefono e computer sulla stessa Wi-Fi.)
- **Con l'emulatore Android:** premi **`a`** nel terminale di `npm start`, oppure
  lancia `npm run android`.

Al primo avvio fai il **login** con l'utente creato al §3.4. Dovresti vedere la
schermata principale (Inbox).

---

## 6. (Opzionale) Far funzionare l'AI: i segreti lato server

L'app si avvia e ti fa **aggiungere elementi** anche senza chiavi AI, ma il
**riassunto, i tag, il bucket suggerito e la ricerca semantica** li produce il
server (le Edge Functions). Per attivarli servono due chiavi API, impostate
**come secret delle Edge Functions** — **mai** in `app/.env`.

Chiavi necessarie (vedi spec §14):

| Secret | A cosa serve |
|---|---|
| `OPENROUTER_API_KEY` | Generazione: riassunto, tag, suggerimento bucket |
| `OPENROUTER_MODEL` | Id del modello, default `google/gemini-2.5-flash` |
| `OPENAI_API_KEY` | Embedding (`text-embedding-3-small`) e trascrizione (`whisper-1`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Scritture lato server (la trovi in Project Settings → API) |

Dove si impostano questi secret:

- **Dashboard:** Supabase → **Edge Functions → (la funzione) → Settings → Secrets**,
  oppure la sezione **Project Settings → Edge Functions / Secrets** del tuo
  progetto.
- **CLI** (dalla radice del repo):

```bash
supabase secrets set \
  OPENROUTER_API_KEY=sk-or-... \
  OPENROUTER_MODEL=google/gemini-2.5-flash \
  OPENAI_API_KEY=sk-... \
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Poi vanno **distribuite** le Edge Functions (`dispatch`, `generate`, …):

```bash
# (da completare quando le Edge Functions saranno pronte in supabase/functions/)
supabase functions deploy dispatch
supabase functions deploy generate
```

> ⚠️ **Promemoria di sicurezza:** queste quattro variabili **non** devono MAI
> stare in `app/.env` né nel codice del client. Il client conosce solo URL +
> anon key. La `service_role` e le chiavi AI vivono **solo** lato server (Edge
> Functions e worker). Vedi CLAUDE.md §3 e spec §14.
>
> Le chiavi: OpenRouter si crea su <https://openrouter.ai> (sezione Keys),
> OpenAI su <https://platform.openai.com> (API keys). Verifica l'id esatto e
> corrente del modello su OpenRouter: gli id cambiano (spec §17).

> **Stato:** la cartella `supabase/functions/` è in costruzione. Finché le
> funzioni `dispatch`/`generate` non sono distribuite, l'elaborazione AI non
> parte: l'app resta usabile per aggiungere e vedere gli elementi, ma il
> riassunto non comparirà. (da completare quando le Edge Functions sono pronte)

---

## 7. Limite importante: lo share intent non funziona in Expo Go

La condivisione nativa di Android (condividere un link da un'altra app
**verso** InfoBucket tramite il menu "Condividi") è descritta nella **spec §12**
e arriva in **Fase 7**. Richiede una **build EAS** (dev o production):

> **Lo share intent Android NON funziona in Expo Go.**

Quindi **in locale, con Expo Go**, provi il flusso alternativo:

- **"Aggiungi incollando un URL"**: apri l'app, incolla manualmente un link nel
  campo di aggiunta e lo salvi. È esattamente il percorso previsto per le prime
  fasi (spec §16, Fase 1) e copre il flusso completo senza la parte nativa.

Per avere la condivisione vera dal menu di sistema serve installare l'APK:
vedi **[INSTALL_ANDROID.md](INSTALL_ANDROID.md)**.

---

## 8. Lanciare i test

Dentro `app/`:

```bash
cd app
npm test
```

Altri comandi utili (sempre dentro `app/`):

```bash
npm run lint        # controllo stile/qualità
npm run typecheck   # controllo dei tipi TypeScript
```

> Una feature non è "fatta" finché i test non passano (CLAUDE.md §5). Se modifichi
> l'app, ri-esegui `npm test` prima di considerarla a posto.

---

## 9. Troubleshooting

**Il QR non si apre / l'app non si carica su Expo Go**
- Telefono e computer devono essere sulla **stessa rete Wi-Fi**.
- Reti aziendali/pubbliche spesso bloccano la connessione tra dispositivi: prova
  un hotspot dal telefono, oppure avvia con il tunnel:
  ```bash
  npx expo start --tunnel
  ```
- Riavvia il dev server pulendo la cache: `npx expo start -c`.

**"Missing/undefined EXPO_PUBLIC_SUPABASE_URL" o errori di connessione a Supabase**
- Hai creato `app/.env` (e **non** solo `.env.example`)?
- I valori sono quelli di **Project Settings → API** (URL e **anon** key, non la
  service role)?
- Dopo aver modificato `.env`, **riavvia** `npm start` (le env si leggono
  all'avvio).

**Login fallito**
- L'utente esiste in **Authentication → Users**? (vedi §3.4)
- La password è quella giusta? Puoi resettarla dal dashboard.

**Errori SQL durante le migrations**
- Le estensioni `vector` e `pg_cron` sono abilitate? (§3.2)
- Stai applicando i file **in ordine numerico**? Un file fuori ordine fallisce
  perché dipende dai precedenti.

**`npm install` fallisce**
- Controlla di avere **Node 22** (`node -v`). Versioni diverse possono dare
  problemi con Expo SDK 52.
- Cancella e reinstalla: `rm -rf node_modules package-lock.json && npm install`.

**L'app parte ma il riassunto/tag non compaiono**
- È atteso finché le Edge Functions non sono distribuite con i secret (§6).
  L'elemento resta in inbox in stato di lavorazione.

---

## Riferimenti

- **[INSTALL_ANDROID.md](INSTALL_ANDROID.md)** — installare l'APK sul telefono e
  abilitare la condivisione nativa.
- **[../infobucket-spec.md](../infobucket-spec.md)** — specifica funzionale
  (vedi §4 stack, §12 share, §14 segreti, §16 ordine di sviluppo, §17 note).
- **[../CLAUDE.md](../CLAUDE.md)** — regole di sviluppo e struttura del monorepo.
