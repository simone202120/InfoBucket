# Come installare InfoBucket sul tuo smartphone Android

Guida passo-passo per creare un **APK** di InfoBucket con EAS Build (gratis, in
cloud) e installarlo sul tuo telefono Android.

> Prima di tutto: assicurati di aver già un progetto Supabase funzionante e di
> conoscere URL + anon key. Se non li hai, fai prima i passi 3–4 di
> **[RUN_LOCAL.md](RUN_LOCAL.md)**.

---

## 1. Perché un APK e non il Play Store

InfoBucket è un'app **personale, per un solo utente** (spec §4). Non ha senso
pubblicarla sul Play Store: pubblicare richiede account a pagamento, revisione e
manutenzione, per un'app che usi solo tu.

La via giusta è il **sideload**: si genera un file **APK** e lo si installa
direttamente sul telefono. Aggiornare l'app = **ricompilare l'APK e
reinstallarlo sopra** (spec §4, §17). Niente store, niente attese di revisione.

L'APK lo costruisce **EAS Build**, il servizio di build in cloud di Expo: non
serve installare Android Studio né l'SDK nativo sul tuo computer, fa tutto il
cloud (e per un APK `preview` è gratuito).

---

## 2. Prerequisiti

- I prerequisiti di **[RUN_LOCAL.md](RUN_LOCAL.md)** (Node 22, npm, Git, repo
  clonato, `npm install` fatto dentro `app/`).
- Un **account Expo** gratuito: <https://expo.dev> → Sign up.
- La **EAS CLI** installata e il login fatto:

```bash
npm install -g eas-cli
eas login        # usa le credenziali dell'account Expo
```

Verifica:

```bash
eas whoami       # deve stampare il tuo username Expo
```

---

## 3. Configurare EAS nel progetto

Dentro la cartella `app/` (è lì che vive l'app Expo):

```bash
cd app
eas build:configure
```

Questo comando:
- collega il progetto al tuo account Expo (crea un `projectId`);
- crea/aggiorna il file **`eas.json`** con i profili di build.

Scegli **Android** quando richiesto.

---

## 4. Il file `eas.json` e il profilo APK

EAS usa i **profili** in `eas.json` per sapere cosa costruire. Per il sideload
ci serve un profilo che produca un **APK** (e non un App Bundle `.aab`, che è
solo per il Play Store).

Esempio minimale di `eas.json` con un profilo **`preview`** che genera un APK
installabile:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://il-tuo-ref.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "la-tua-anon-public-key"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

Note:
- **`buildType: "apk"`** è la chiave: senza, `production` genererebbe un `.aab`
  pensato per lo store, non installabile direttamente.
- Per uso personale il profilo **`preview`** va benissimo. Usa `production` solo
  se vuoi un build "ufficiale" — ricordati di mettere comunque `buildType: "apk"`.
- La sezione **`env`** serve a passare le variabili pubbliche al momento della
  build (vedi §5). In alternativa puoi usare gli **EAS Secrets**, sempre §5.

> `eas build:configure` (§3) crea già un `eas.json` di base: ti basta
> aggiungere/adeguare `buildType: "apk"` e la sezione `env` come sopra.

---

## 5. Far puntare l'app al tuo Supabase (variabili al momento della build)

L'APK è un'app "compilata": le variabili `EXPO_PUBLIC_*` (URL + anon key del tuo
Supabase) vengono **incorporate al momento della build**. Se non ci sono, l'app
installata non saprà a quale Supabase collegarsi.

> Importante: il file `app/.env` che usi in locale **non viene caricato
> automaticamente** da una build in cloud. Devi fornire le variabili a EAS in uno
> di questi due modi.

**Modo A — sezione `env` in `eas.json`** (semplice, mostrato al §4)

Metti i valori dentro `build.preview.env`. Comodo, ma attenzione: l'anon key
finisce dentro `eas.json`. Va bene perché **è pubblica per design** (protetta
dalle RLS); **non** mettere mai qui chiavi AI o la service role.

**Modo B — EAS Secrets** (più pulito, niente valori nel file)

```bash
cd app
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://il-tuo-ref.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "la-tua-anon-public-key"
```

EAS li inietta automaticamente durante la build. In questo caso puoi togliere la
sezione `env` da `eas.json`.

> ⚠️ Anche qui: **solo** `EXPO_PUBLIC_SUPABASE_URL` e
> `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Le chiavi OpenRouter/OpenAI e la
> `SUPABASE_SERVICE_ROLE_KEY` vivono **solo lato server** (Edge Functions +
> worker), **mai** nell'app (CLAUDE.md §3, spec §14).

---

## 6. Costruire l'APK

Dentro `app/`:

```bash
cd app
eas build -p android --profile preview
```

Cosa succede:
- EAS carica il progetto e avvia la build **in cloud** (non sul tuo computer).
- L'attesa è tipicamente di qualche minuto (può variare in base alla coda del
  tier gratuito).
- Al termine, la CLI stampa un **link**; lo stesso build compare anche nella
  dashboard <https://expo.dev> → il tuo progetto → **Builds**.

---

## 7. Scaricare e installare l'APK sul telefono

1. Apri il **link** della build (dal terminale o dalla dashboard Expo)
   **dal telefono** (es. invialo a te stesso o aprilo nel browser del telefono).
2. Scarica il file **`.apk`**.
3. Avvia l'installazione toccando il file scaricato. Android ti chiederà il
   permesso di **installare da fonti sconosciute**:
   - segui il prompt → **Impostazioni** → consenti l'installazione di app dal
     browser/gestore file che stai usando (la voce esatta varia per versione di
     Android: di solito "Installa app sconosciute" / "Consenti da questa fonte");
   - torna indietro e completa l'installazione.
4. Apri InfoBucket e fai il **login** con il tuo utente Supabase.

> Questa abilitazione "fonti sconosciute" serve solo per il sideload del primo
> APK (spec §17). È normale e sicura per un'app che hai compilato tu.

---

## 8. Come funzionerà la condivisione

Lo scopo finale è poter **condividere un link da un'altra app** (browser,
YouTube, Instagram, …) scegliendo **InfoBucket** dal menu "Condividi" di Android.
L'app riceve il link, mostra un mini-form con campo nota, salva una riga e si
chiude; il server fa il resto (spec §12).

Stato attuale:

- La ricezione dello **share intent** Android arriva in **Fase 7** del piano
  (spec §16). Richiede una build EAS — questa stessa APK — perché **non funziona
  in Expo Go**.
- **Fino a quando lo share intent non è implementato e ricompilato nell'APK**, si
  usa l'**aggiunta manuale via URL**: apri InfoBucket e incolla il link nel campo
  di aggiunta. È il flusso previsto per le prime fasi (spec §16, Fase 1) e copre
  tutto il percorso tranne la comodità del "Condividi".

> (da completare quando la Fase 7 sarà implementata): dopo aver aggiunto lo share
> intent nel codice e nella config Android, **ricompila l'APK** (§6) e
> reinstallalo; solo allora InfoBucket comparirà nel menu Condividi.

---

## 9. Aggiornare l'app

Non c'è uno store che spinge gli aggiornamenti: aggiornare = **ricompilare e
reinstallare**.

```bash
cd app
git pull                                   # prendi le novità del codice
eas build -p android --profile preview     # nuovo APK
```

Poi scarica il nuovo APK (§7) e **installalo sopra** quello esistente: Android
riconosce che è la stessa app (stesso package `com.infobucket.app`) e aggiorna
mantenendo dati e login.

> Se cambi l'URL o l'anon key del Supabase, aggiorna le variabili (§5) **prima**
> di ricompilare, altrimenti la nuova build punterà ancora al vecchio progetto.

---

## 10. Troubleshooting

**"App non installata" / installazione bloccata**
- Hai abilitato "installa da fonti sconosciute" per l'app da cui apri l'APK? (§7)
- Stai installando sopra una versione firmata in modo diverso? Disinstalla la
  vecchia app e reinstalla (perderai i dati locali, ma l'account e i contenuti
  stanno su Supabase).

**L'app si apre ma non si collega a Supabase / login impossibile**
- Le variabili `EXPO_PUBLIC_*` erano presenti al momento della build? (§5)
  Verifica `eas.json` o gli EAS Secrets, poi **ricompila**.
- L'utente esiste in Supabase → Authentication → Users?

**La build EAS fallisce**
- Leggi il log nella dashboard <https://expo.dev> → Builds → la build → Logs.
- Cause comuni: `eas.json` malformato, `app.config.ts` con errori,
  dipendenze non installate. Fai girare prima `npm install` e `npm run typecheck`
  in locale dentro `app/`.

**InfoBucket non compare nel menu "Condividi"**
- È atteso finché la Fase 7 (share intent) non è implementata e ricompilata
  nell'APK (§8). Nel frattempo usa l'aggiunta manuale via URL.

---

## Riferimenti

- **[RUN_LOCAL.md](RUN_LOCAL.md)** — creare il progetto Supabase, configurare
  `.env`, provare l'app in locale con Expo Go.
- **[../infobucket-spec.md](../infobucket-spec.md)** — spec funzionale
  (§4 stack/APK, §12 share Android, §14 segreti, §16 fasi, §17 note APK).
- **[../CLAUDE.md](../CLAUDE.md)** — regole di sviluppo e segreti solo lato server.
