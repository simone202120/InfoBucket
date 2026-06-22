# InfoBucket

App mobile personale (Android) per raccogliere informazioni da fonti diverse in un
unico posto, farle riassumere / taggare / organizzare dall'AI e ritrovarle **per
significato**.

> Cattura a basso attrito, review calma e batch, ricerca semantica. Singolo utente.

## Struttura

| Cartella | Cosa contiene |
|---|---|
| `app/` | Client Expo / React Native (TypeScript) — l'app Android |
| `supabase/` | Schema DB, RLS, cron, RPC (`migrations/`) + Edge Functions `dispatch` e `generate` (`functions/`) |
| `worker/` | Servizio always-on che estrae audio→testo dai video (yt-dlp + ffmpeg + Whisper) |
| `InfoBucket Design System/` | Fonte di verità **visiva** (token, componenti web di riferimento) |
| `docs/` | Guide: mappa del codice, run in locale, installazione su Android |

## Documentazione

- **[docs/CODE_MAP.md](docs/CODE_MAP.md)** — mappa di moduli, dipendenze e relazioni.
- **[docs/RUN_LOCAL.md](docs/RUN_LOCAL.md)** — come scaricarla e provarla in locale.
- **[docs/INSTALL_ANDROID.md](docs/INSTALL_ANDROID.md)** — come installarla sullo smartphone.
- **[infobucket-spec.md](infobucket-spec.md)** — specifica funzionale completa (v2).
- **[CLAUDE.md](CLAUDE.md)** — regole di sviluppo.

## Avvio rapido

```bash
cd app && npm install && npm start   # avvia il dev server Expo
```

I segreti (chiavi OpenRouter/OpenAI, service role) vivono **solo lato server**
(Edge Functions + worker), mai nel client. Vedi i file `.env.example`.
