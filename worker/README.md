# InfoBucket — Worker (estrazione media)

Servizio always-on che estrae **audio → testo** e **caption** dai contenuti
video (reel Instagram, TikTok, YouTube senza transcript) per InfoBucket.
È uno dei tre attori del sistema (vedi `infobucket-spec.md` §3, §7): l'app cattura,
Supabase è il cervello, **il worker fa solo estrazione media**.

> Stato: **scaffold strutturato** (Fase 6 della roadmap). Loop di polling e claim
> atomico sono reali; le parti che invocano `yt-dlp`/`ffmpeg`/Whisper sono stub
> marcati `// TODO Fase 6` con il contratto e le note di implementazione.

## Cosa fa

A polling (nessuna porta aperta, solo connessioni in uscita):

1. **Claim atomico** di un item `media_stage = 'pending'` → `'processing'`
   (`update ... where media_stage='pending' returning`, evita doppie prese, §7.1).
2. **Caption / metadati** leggeri (§7.2):
   - TikTok via oEmbed ufficiale (`https://www.tiktok.com/oembed?url=...`),
   - Instagram best-effort via Open Graph (fragile: degrada con grazia),
   - YouTube titolo + descrizione.
3. **Download + audio**: `yt-dlp` scarica lo stream, `ffmpeg` estrae una traccia
   audio compatta (mono, basso bitrate).
4. **Trascrizione**: OpenAI **Whisper** (`whisper-1`), riusando la stessa
   `OPENAI_API_KEY` degli embedding (nessuna terza chiave, §4).
5. **Compone `raw_content`** etichettato (`[Caption]/[Autore]/[Trascrizione]`, §7.5)
   e lo persiste.
6. **Pulizia** del file temporaneo, `media_stage = 'done'`, e chiama la Edge
   Function `generate`.
7. **Errori** (video privato, download bloccato…): `media_stage = 'error'` + `error`,
   **ma chiama `generate` lo stesso** — caption + nota bastano spesso (§7.7).

## Struttura

```
src/
  index.ts            loop di polling, claim atomico, orchestrazione
  env.ts              caricamento + validazione env (fail-fast)
  supabase.ts         client Supabase (service role)
  types.ts            tipi allineati agli enum SQL (§5) e a app/src/types/domain.ts
  rawContent.ts       composeRawContent() — puro, testato (§7.5)
  generate.ts         invocazione della Edge Function generate (§7.6/§7.7)
  extract/
    caption.ts        parser puri oEmbed/Open Graph + fetch iniettabile (§7.2)
    media.ts          downloadAudio() / transcribe() — scaffold yt-dlp/ffmpeg/Whisper
```

I moduli puri (`composeRawContent`, `parseTiktokOembed`, `parseOpenGraph`) sono
coperti da test (`*.test.ts`), con I/O e rete mockati/iniettati.

## Esecuzione in locale

Richiede **Node 22**. Per il funzionamento reale (Fase 6) servono anche
`ffmpeg` e `yt-dlp` nel `PATH`.

```bash
cd worker
npm install
cp .env.example .env   # compila i valori
npm run typecheck      # tsc --noEmit
npm test               # vitest run
npm start              # avvia il loop di polling
```

Comandi disponibili: `start`, `dev` (watch), `test`, `lint`, `typecheck`.

## Variabili d'ambiente

Vedi `.env.example`. Richieste:

| Variabile | Uso |
|---|---|
| `SUPABASE_URL` | URL del progetto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | scritture di pipeline lato server (mai nel client) |
| `OPENAI_API_KEY` | trascrizione Whisper (stessa chiave degli embedding) |
| `POLL_INTERVAL_MS` | intervallo di polling, default `5000` |

Se manca una variabile richiesta, il worker non si avvia e stampa quali mancano.

## Deploy

Immagine Docker pronta (Node 22 slim con `ffmpeg` + `yt-dlp`). Nessuna porta
esposta. Opzioni consigliate (spec §4):

1. **Railway** / **Render** (background worker) — deploy da Git, tier economico.
   *Primo passo consigliato.* Imposta le env nel dashboard del servizio.
2. **Fly.io** — `fly deploy` con il Dockerfile; può scalare a zero.
3. **Hetzner CX22** (~4 €/mese) — VPS con Docker:
   `docker build -t infobucket-worker . && docker run --env-file .env infobucket-worker`.

In tutti i casi le chiavi vanno fornite come variabili d'ambiente del servizio,
mai nel repo.
