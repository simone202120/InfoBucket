# Spec — InfoBucket "app vera": fix funzionali + redesign

**Data:** 2026-06-23
**Branch di lavoro:** da creare (`feat/app-polish-redesign`)
**Stato:** approvato in brainstorming, pronto per il piano

## 1. Obiettivo

Trasformare InfoBucket da prototipo funzionante a **app vera e moderna**: chiudere
sei difetti d'uso che oggi la rendono frustrante, e darle un'identità visiva
riconoscibile ("Editorial Provenance"). Vincolo non negoziabile: **tutto lo stile
passa dai token del theme adapter** (`app/src/theme/`) — l'estetica è libera,
l'architettura resta a sorgente unica, così cambiando i token cambia l'intera app.

Non si tocca il worker né la pipeline AI (Edge Functions). Il lavoro è lato **app
Expo** + una **modifica di configurazione Supabase Auth**.

## 2. Scope

**Incluso:** i 6 fix funzionali, il nuovo sistema cromatico (temi Cloud/Ink +
selettore accento esteso), header editoriale, icone reali, momento di brand,
componenti nuovi (Toast, TranscriptSheet, AvatarMenu), micro-interazioni, due
aggiunte "bold" (lettura immersiva, Inbox raggruppata).

**Escluso:** worker/estrazione media, Edge Functions, schema DB (nessuna
migrazione prevista), ricerca semantica (logica invariata), share intent (già
presente).

## 3. Correzioni funzionali

### 3.1 Login & sessione
- **Causa:** `signUp` (`app/src/features/auth/AuthContext.tsx`) usa Supabase con
  *Confirm email* attivo e *Site URL = localhost*: la mail di conferma è
  inutilizzabile → registrazione mai completata → nessuna sessione (la persistenza
  AsyncStorage è già configurata in `app/src/lib/supabase.ts` e funziona).
- **Azione (config, fuori dal codice):** su Supabase Auth disattivare *Confirm
  email* e impostare un *Site URL* valido. Da fare via dashboard o Management API.
- **Azione (app):** nessun cambio strutturale. Rete di sicurezza: se `signUp`
  ritorna senza sessione e senza errore (conferma riattivata in futuro), mostrare
  uno stato "Controlla la tua email" invece di lasciare la schermata muta.
- **Esito:** registrazione/accesso immediati, sessione ricordata fra riavvii.

### 3.2 Freschezza dati (niente più reload manuale)
- **Causa:** gli hook (`app/src/features/useItemList.ts`,
  `features/library/useLibrary.ts`, `features/review/useItemDetail.ts`) fanno
  fetch **solo al mount**; con expo-router le schermate restano montate, quindi
  tornando indietro i dati sono vecchi. Nessun refetch al focus, nessun polling.
- **Approccio scelto:** focus-refetch + polling mirato.
  - Nuovo helper `useFocusRefetch(refetch)` (wrapper su `useFocusEffect` di
    expo-router) usato da Inbox, Libreria, Archivio, dettaglio bucket.
  - Nuovo helper `usePolling(callback, { active, intervalMs })`: attivo **solo
    finché esistono item in `processing`** nella lista corrente; intervallo ~5s;
    si autospegne quando non ci sono più processing. Riuso comune fra Inbox e
    dettaglio item (processing→ready).
- **Confini:** gli helper vivono in `app/src/features/` (puri, testabili con timer
  mockati); gli hook esistenti li compongono senza duplicare logica.

### 3.3 Feedback sulla conferma in bucket
- **Causa:** `ReviewScreen`/`ConfirmBucket`
  (`app/src/features/review/ReviewScreen.tsx`) non reagisce al successo di
  `confirm()`: nessun toast, nessuna navigazione (a differenza di `remove`).
- **Approccio:** nuovo componente **`Toast`** nel design system
  (`app/src/theme/components/Toast.tsx`) + provider leggero (`ToastProvider` in
  `app/src/theme/` o context dedicato) con API `showToast({ message, icon })`.
  Alla conferma riuscita: check animato + toast "Salvato in «Nome»" + `router.back()`.
  Riuso per altri successi (bucket creato, modifiche salvate).

### 3.4 Trascrizione / testo estratto
- **Causa:** `ReviewScreen.transcriptPreview` mostra 600 caratteri + "…" e solo
  per youtube/reel/tiktok; per articoli/documenti niente.
- **Approccio:** nuovo componente **`TranscriptSheet`**
  (`app/src/theme/components/TranscriptSheet.tsx`) — pannello a tutta pagina che
  sale dal basso, scrollabile, testo completo in Newsreader. In `ReviewScreen`,
  quando `item.rawContent` è presente (qualunque fonte), un pulsante apre lo sheet:
  etichetta **"Apri trascrizione"** per video/reel/tiktok, **"Apri testo"** per
  articolo/documento/nota. Rimuovere l'anteprima inline a 600 caratteri.

### 3.5 Impostazioni raggiungibili subito
- **Causa:** la rotta `settings` (modale) è aperta solo dall'ingranaggio
  nell'header della Inbox.
- **Approccio:** nuovo componente **`AvatarMenu`**
  (`app/src/theme/components/AvatarMenu.tsx`): pastiglia con le **iniziali
  dell'email** in alto a destra negli header di Inbox/Libreria/Cerca. Tap → menu
  (popover/sheet) con **Impostazioni** ed **Esci**. La schermata Impostazioni
  resta invariata (contiene già Account). Rimuovere l'ingranaggio dalla Inbox.

### 3.6 Polish di base
- Microcopy in **italiano** dove ora è inglese: `StatusBadge` (`Processing`→…),
  `ItemCard` (`SOURCE_LABEL`, "Summarising…", "In X days → Archive"), `AddButton`
  (`accessibilityLabel` "Add"). I valori restano centralizzati nei rispettivi
  componenti del design system.
- **Skeleton list** al primo caricamento (riuso dello skeleton già in `ItemCard`)
  al posto dello spinner nudo in Inbox/Libreria/Cerca/Bucket.
- `ItemCard` toccabile con **`PressableScale`** (coerente con `BucketCard`).
- Rimuovere il **countdown duplicato** nello stato *expiring* di `ItemCard`.

## 4. Direzione visiva — "Editorial Provenance"

### 4.1 Principi
- **Riassunto = eroe** (Newsreader), come da spec.
- **Elemento firma:** la **provenienza a colori** — ogni `ItemCard` porta una
  sottile barra laterale (rail) nel colore della fonte; la "spina" dei bucket si
  allinea allo stesso linguaggio.

### 4.2 Temi (token in `app/src/theme/tokens.ts`)
- **Light = "Cloud":** `bg #F5F6F8`, `surface #FFFFFF`, `ink #191F26`,
  secondari/terziari e bordi rivisti per il nuovo fondo.
- **Dark = "Ink":** `bg #0F1217`, `surface #181D24`, testo `#ECF1F6`.
- I valori esatti dei due schemi vengono aggiornati nell'oggetto `color` di
  `tokens.ts`; i componenti non cambiano perché leggono dall'adapter.

### 4.3 Sistema accento (esteso) — `tokens.ts` + `index.ts`
- Mantenere il **selettore accento in entrambi i temi** (già presente in
  `app/app/settings.tsx` via `useThemeControls`).
- **Aggiungere preset** all'oggetto `accents` (oltre ai 6 attuali: alcuni nuovi,
  con varianti `light`/`dark` esplicite e nomi italiani in `ACCENT_LABEL`).
- **Colore personalizzato:** nuova voce "Personalizza" che apre un color picker
  (hue/saturation o hex). Da una sola tinta scelta si **derivano** le varianti:
  - variante `dark` = stessa tinta con lightness alzata per il fondo scuro;
  - `primaryHover`/`primaryPress` derivati per shift di lightness;
  - `textOnPrimary` scelto fra ink/bianco in base alla **luminanza** dell'accento
    (garanzia di contrasto AA).
  - L'accento custom va **persistito** (AsyncStorage) insieme alla scelta di
    accento/tema; oggi `ThemeProvider` tiene lo stato in memoria → aggiungere
    persistenza della preferenza tema (accent + modeOverride + customColor).
- Nuovo modulo puro `app/src/theme/accent.ts` con le funzioni di derivazione
  (luminanza, shift di lightness, scelta testo) — testabile in isolamento.

### 4.4 Header editoriale (Opzione A)
- Header con **titolo grande** (Bricolage display, ~29px) + occhiello mono
  (es. "Da rivedere") + **`AvatarMenu`** a destra. Applicato a Inbox/Libreria/Cerca
  in modo coerente (eventuale piccolo componente `ScreenHeader` condiviso).

### 4.5 Icone — `app/src/theme/icons.tsx`
- **Social = loghi reali a colori** (YouTube, TikTok bicolore, Instagram con
  gradiente), proporzioni corrette, su tile chiara (in `SourceStamp`).
- **Articoli web = favicon reale del dominio** (es. `https://www.google.com/s2/favicons`
  o `https://<host>/favicon.ico`) tramite `hostnameOf` (`app/src/lib/source.ts`);
  fallback al glifo articolo se assente/non carica. Caricamento con stato e cache
  leggera; degrada con grazia (mai card rotta).
- **Documento / Nota = icone duotone realistiche** (file con orecchio, foglietto).
- **Nav ridisegnate** (Inbox/Libreria/Cerca/Aggiungi).
- `SourceStamp` (`app/src/theme/components/SourceStamp.tsx`) diventa il punto unico
  che sceglie logo brand vs favicon vs glifo in base a `source_type`/URL.

### 4.6 Momento di brand
- **Login** (`app/app/login.tsx`): wordmark *InfoBucket* (Bricolage) + glifo a
  trattini-provenienza. Stesso lampo come breve splash all'avvio
  (`app/app/_layout.tsx`, dove oggi c'è `SplashLoader`).

## 5. Aggiunte "bold"

- **Lettura immersiva (dettaglio item):** in `ReviewScreen`, il riassunto in
  modalità lettura diventa una **citazione grande** in Newsreader; azioni
  principali (Salva in bucket / Apri testo) ancorate in basso, raggiungibili col
  pollice. La modalità edit resta accessibile.
- **Inbox raggruppata:** `app/app/(tabs)/index.tsx` mostra sezioni
  **"In scadenza" / "Recenti"** (header di sezione). Raggruppamento puro lato UI a
  partire da `isExpiring`/`daysLeft` (`app/src/lib/lifecycle.ts`). Opzionale ma
  previsto.
- **Swipe sulle card (Inbox):** gesto su `ItemCard` che rivela azioni rapide
  **Salva / Archivia** senza aprire il dettaglio. **Richiede una nuova dipendenza**
  (`react-native-gesture-handler`, oggi assente). È la voce più **rinviabile**: se
  il costo non vale, si lascia per una fase successiva.

## 6. Micro-interazioni (motion)
Estendono `app/src/theme/motion.tsx` (oggi solo API `Animated` nativa, nessuna
dipendenza extra), sempre rispettando "riduci movimento":
- **Haptics** su conferma, swipe completato, accetta-bucket. **Richiede una nuova
  dipendenza** (`expo-haptics`, oggi assente) — opzionale, raggruppabile con lo swipe.
  Le altre micro-interazioni restano sull'API `Animated` nativa (nessuna dep nuova).
- **Rail "draw-in"** all'ingresso della card.
- **Scala al tocco** su tutte le card + bottoni (via `PressableScale`).
- **Entrata sfalsata** (già presente) + **skeleton shimmer**.
- **Pull-to-refresh** col colore accento.
- **Check animato** + toast alla conferma.
- **Sheet** trascrizione/testo che sale dal basso; transizione morbida lista→dettaglio.

## 7. Componenti e moduli nuovi (riepilogo confini)
- `theme/components/Toast.tsx` + provider — feedback effimero. Input: messaggio/icona.
- `theme/components/TranscriptSheet.tsx` — sheet testo completo. Input: testo + titolo.
- `theme/components/AvatarMenu.tsx` — avatar + menu. Input: email, azioni.
- `theme/components/ScreenHeader.tsx` (opz.) — header editoriale condiviso.
- `theme/accent.ts` — derivazione accento custom (puro).
- `features/useFocusRefetch.ts`, `features/usePolling.ts` — freschezza dati (puri).
- Estensioni: `tokens.ts` (temi+accenti), `icons.tsx` (loghi/favicon),
  `SourceStamp.tsx`, `ItemCard.tsx`, `StatusBadge.tsx`, `ReviewScreen.tsx`,
  `(tabs)/*`, `settings.tsx`, `login.tsx`, `_layout.tsx`, `ThemeProvider`.

## 8. Testing
- **Puri:** `accent.ts` (derivazione + contrasto), `usePolling`/`useFocusRefetch`
  (timer/focus mockati), raggruppamento Inbox, scelta logo/favicon/glifo.
- **Componenti (RTL):** `Toast`, `TranscriptSheet` (apre/chiude, mostra testo),
  `AvatarMenu` (menu, esci), `ItemCard` (rail per fonte, niente countdown doppio,
  microcopy IT), `StatusBadge` (label IT).
- **Flussi:** `ReviewScreen` conferma → toast + back; freschezza → refetch al focus.
- Mock di rete/Supabase come da convenzione. `typecheck` + `lint` puliti.

## 9. Rischi e mitigazioni
- **Config Supabase** non è codice: documentare i passi; senza, il login resta
  rotto. Verificare via login reale.
- **Favicon esterne:** rete inaffidabile → sempre fallback al glifo, mai bloccare.
- **Swipe/gesti:** se `react-native-gesture-handler` non è già integrato, valutare
  costo/beneficio; è la feature più rinviabile.
- **Scope ampio:** il piano (writing-plans) lo spezzerà in fasi sequenziabili
  (es. 1: fix funzionali → 2: token/temi+accento → 3: icone/header/brand →
  4: bold/micro-interazioni), per avere presto valore e diff rivedibili.

## 10. Definition of Done (da CLAUDE.md)
Spec implementata senza stile hardcoded e senza segreti nel client; `typecheck`/
`lint` puliti; test verdi per logica e componenti toccati; `docs/CODE_MAP.md`
aggiornato; diff rivisto (ingegneria + sicurezza); commit chiari sul branch.
