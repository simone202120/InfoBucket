# Worker InfoBucket — estrazione media (yt-dlp + ffmpeg + Whisper).
# Node 22 slim + ffmpeg + yt-dlp. Pronta per Railway/Fly/Hetzner (spec §4).
# Nessuna porta esposta: il worker fa solo connessioni in uscita (§3).
FROM node:22-slim

# Dipendenze di sistema:
#  - ffmpeg: estrazione/normalizzazione audio (§7.3)
#  - python3 + curl/ca-certificates: per installare e far girare yt-dlp
# yt-dlp installato come binario standalone (più aggiornato dei pacchetti apt).
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ca-certificates \
    curl \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
       -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp \
  && apt-get purge -y curl \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installa le dipendenze separatamente dal codice per sfruttare la cache layer.
COPY package.json package-lock.json* ./
# Servono anche le devDependencies (tsx esegue il TS direttamente, niente build).
RUN npm ci

COPY . .

# Verifica che il codice compili (fail-fast in build).
RUN npm run typecheck

# Esegue come utente non-root (immagine node fornisce l'utente `node`).
USER node

CMD ["npm", "start"]
