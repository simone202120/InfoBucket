# Deploy — InfoBucket

Come portare in produzione le tre parti: **Edge Functions** (Supabase cloud),
**worker** (la tua VPS sempre accesa) e **app** (APK Android). Per l'architettura
vedi `docs/CODE_MAP.md`; per la prova in locale `docs/RUN_LOCAL.md`.

I segreti vivono SOLO lato server (Edge Functions secrets + env della VPS), MAI nel
repo o nel client (CLAUDE.md §3).

---

## 1. Edge Functions (Supabase cloud)

Le function girano sul progetto Supabase già collegato. Dopo ogni modifica vanno
ridistribuite, altrimenti l'app continua a usare la versione vecchia.

```bash
supabase login                      # interattivo (browser), una tantum
supabase functions deploy dispatch  # ridistribuisci la function cambiata
# (deploy di tutte: supabase functions deploy)
```

I secrets (`OPENROUTER_API_KEY`, `OPENAI_API_KEY`, ecc.) si impostano una volta con
`supabase secrets set` e restano. `dispatch` non richiede nuovi secret: l'estrazione
caption (oEmbed TikTok / Open Graph) e quella YouTube (InnerTube / oEmbed) usano solo
chiamate pubbliche, senza chiavi (la chiave InnerTube è quella pubblica del web player).

---

## 2. Worker sulla VPS (Docker)

Il worker è un processo sempre attivo che fa solo connessioni in uscita (nessuna
porta esposta). Estrae l'audio dei media (`yt-dlp` + `ffmpeg`) e lo trascrive
(Whisper). Senza worker, l'app funziona comunque: i media restano con il riassunto
dalla didascalia prodotto da `dispatch`; il worker aggiunge il parlato.

### Build ed esecuzione

```bash
# sulla VPS, nella cartella del repo
docker build -t infobucket-worker ./worker

docker run -d --name infobucket-worker --restart unless-stopped \
  -e SUPABASE_URL="https://<project-ref>.supabase.co" \
  -e SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
  -e OPENAI_API_KEY="<openai-key>" \
  infobucket-worker

docker logs -f infobucket-worker     # deve stampare "Worker avviato (poll ogni 5000ms)."
```

`--restart unless-stopped` lo fa ripartire al reboot della VPS. Le variabili sono le
stesse di `worker/.env.example` (NON copiare `.env` sulla VPS: passa le env con `-e`).

### Cookie per i TikTok con login (opzionale)

Molti TikTok richiedono l'autenticazione: senza cookie `yt-dlp` non scarica l'audio
e resta solo il riassunto da didascalia. Sulla VPS (headless) `--cookies-from-browser`
non è utilizzabile: si usa un **file cookie**.

1. Dal browser dove sei loggato su TikTok, esporta un `cookies.txt` (formato
   Netscape — es. estensione "Get cookies.txt LOCALLY").
2. Copialo sulla VPS: `scp tiktok-cookies.txt utente@vps:/srv/infobucket/cookies.txt`
3. Montalo nel container (sola lettura) e indicalo con `YTDLP_COOKIES_FILE`:

```bash
docker run -d --name infobucket-worker --restart unless-stopped \
  -e SUPABASE_URL="..." -e SUPABASE_SERVICE_ROLE_KEY="..." -e OPENAI_API_KEY="..." \
  -e YTDLP_COOKIES_FILE="/cookies/tiktok.txt" \
  -v /srv/infobucket/cookies.txt:/cookies/tiktok.txt:ro \
  infobucket-worker
```

I cookie scadono: se le trascrizioni TikTok ricominciano a fallire con un errore di
login, riesporta il file. Il riassunto da didascalia continua comunque a funzionare.

### Aggiornare il worker

```bash
git pull
docker build -t infobucket-worker ./worker
docker rm -f infobucket-worker
docker run -d ...   # stesso comando di sopra
```

---

## 3. App Android (APK)

Vedi `docs/INSTALL_ANDROID.md` per il build standalone con EAS
(`eas build -p android`). Per l'uso "vero" (share intent reale, installabile)
serve l'APK; Expo Go va bene solo per lo sviluppo.

> [!IMPORTANT]
> **Serve un rebuild nativo (non un update OTA) — moduli nativi del Piano 3.**
> Il branch `piano-spec-3` aggiunge due dipendenze **native**:
> `react-native-gesture-handler` (swipe sulle card) ed `expo-haptics` (feedback).
> Un aggiornamento JS "over-the-air" (EAS Update/Metro) **non** le include: va
> rifatto il build con `eas build -p android` e reinstallato l'APK. Tutte le altre
> modifiche dei Piani 2/3 sono lato client e arrivano con lo stesso build.
> Togli questa nota quando il primo APK con queste dipendenze è distribuito.
