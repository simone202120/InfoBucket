# Brief per Claude Design — infobucket (app mobile)

> Incolla questo in Claude Design. Obiettivo: mockup ad alta fedeltà delle schermate principali + un **design system documentato e pronto all'implementazione** che poi passerò a Claude Code per costruire l'app. Nome provvisorio.

---

## Cosa stai progettando

Un'app **mobile** (iOS + Android, stack React Native / Expo) a **uso personale di una sola persona**: la usa a fine giornata per smaltire una coda di cose salvate e per ritrovarle quando le servono.

Il lavoro unico dell'app: rendere la **triage calma e veloce** e il **ritrovare immediato**. Il suo "mondo" è quello dei frammenti catturati al volo da fonti diverse (articoli, video, documenti) — una biblioteca personale viva, in cui le cose hanno una scadenza se non vengono messe in ordine.

Il contenuto è l'eroe: il **riassunto** di ogni elemento deve essere la cosa più leggibile dello schermo.

---

## Cosa deve fare (funzionalità, in sintesi)

- L'utente **condivide** un link (articolo / YouTube / reel) o un documento all'app, con una **nota** opzionale (anche dettata).
- L'elemento finisce in **Inbox** e l'AI lo elabora in background: **riassunto + tag + bucket proposto**.
- I **bucket** sono le collezioni create dall'utente. L'AI propone tra quelli esistenti e, se nessuno calza, propone di crearne uno nuovo.
- In **review**, l'utente conferma il bucket (accetta / cambia / crea), sistema i tag, può modificare la nota e **rigenerare** il riassunto.
- **Ricerca** a campo libero che restituisce le cose più adatte per significato (semantica + parole chiave).
- **Ciclo di vita**: ciò che resta in Inbox non confermato dopo 7 giorni va in **Archivio** (recuperabile), e dopo altri 20 giorni viene eliminato. Ciò che è salvato in un bucket resta per sempre.

---

## Le view da progettare

Navigazione: **tab bar in basso** (Inbox · Libreria · Cerca) + un'azione **"+"** prominente per l'aggiunta manuale; Impostazioni da header/profilo.

1. **Inbox** (home) — la coda di review. Card per elemento con: etichetta/icona della fonte, titolo o fonte, anteprima del riassunto, **chip "bucket proposto" con accetta-al-volo**, tag, indicatore di stato (in lavorazione / pronto) e, per gli elementi che invecchiano, un badge discreto "tra N giorni in archivio".
2. **Dettaglio / Review** — riassunto (modificabile), tag (aggiungi/rimuovi), campo **nota** con dettatura, pulsante **Rigenera**, **conferma bucket** (accetta proposto / scegline un altro / crea quello nuovo), elimina, link alla fonte.
3. **Libreria / Bucket** — tutti i bucket (lista o griglia) con nome, conteggio e descrizione breve. Azione "nuovo bucket".
4. **Dettaglio bucket** — gli elementi salvati nel bucket, con filtro/ricerca interna.
5. **Lettura elemento salvato** — vista pulita di riassunto + tag + fonte + nota (può essere il dettaglio in modalità "salvato").
6. **Cerca** — campo libero, risultati ibridi con i più adatti in alto, filtri per bucket e tag, stato vuoto come invito.
7. **Aggiungi manuale** — incolla URL + nota opzionale (usata prima dello share nativo, utile anche come fallback).
8. **Cattura / Share extension** — vista **minimale** che appare condividendo da un'altra app: anteprima dell'URL + nota veloce + salva.
9. **Crea / Modifica bucket** — form nome + descrizione, con un hint che spiega che la descrizione serve a far scegliere meglio il bucket all'AI.
10. **Archivio** — elementi decaduti, recuperabili, con countdown "tra N giorni eliminato" e azione "salva in un bucket".
11. **Impostazioni** — account, gestione bucket, info sul ciclo di vita.
12. **Stati trasversali** — vuoto (inbox "tutto sistemato", ricerca vuota, bucket vuoto), caricamento/elaborazione (skeleton discreto), errore.

---

## Direzione visiva

Prendi una **posizione precisa e specifica per questa app**, non un tema generico.

**Evita esplicitamente i tre look in cui l'AI casca a prescindere dal soggetto:** (1) sfondo crema caldo + serif ad alto contrasto + accento terracotta; (2) sfondo quasi nero + singolo accento verde acido/vermiglio; (3) impaginazione da quotidiano con righe sottili, zero raggi e colonne fitte. Sono default, non scelte. Dove un asse è libero, non spenderlo su uno di questi.

Due **segnali strutturali sono veri** e devono guidare la grafica (non decorarla): la **fonte** (articolo / YouTube / reel / documento) e lo **stato** (in lavorazione / pronto / salvato / in archivio / in scadenza).

**Elemento-firma** (scegline uno solo, e concentra lì l'audacia tenendo quieto il resto): l'idea di **freschezza/decadenza** degli elementi in inbox (le cose hanno una vita), oppure il trattamento della **provenienza** (da dove arriva ogni cosa).

**Tipografia**: accoppiamento display + testo + utility deliberato e caratteristico, non quello da qualsiasi app. Usa font disponibili in React Native (di sistema o Google Fonts via `expo-font`).

**Motion**: poca e mirata. L'animazione sparsa fa sembrare il design generato dall'AI.

---

## Design system da produrre (il deliverable che mi serve)

Un design system **documentato e pronto all'implementazione** (target React Native / Expo, da passare a Claude Code), più i **mockup ad alta fedeltà** delle schermate principali in tema **chiaro e scuro**.

Token:
- **Colore**: palette di 4–6 hex nominati + token semantici (sfondo, superficie/card, testo primario/secondario, primario/azione, accento, successo, attenzione/scadenza, bordo). Definisci chiaro e scuro.
- **Tipografia**: scala con famiglie, dimensioni, pesi e interlinea per i ruoli (display/titoli, corpo/riassunto, utility/etichette).
- **Spaziatura, raggi, elevazioni/ombre** come scale.
- **Iconografia**: stile coerente.

Componenti (con i loro stati): card elemento (in lavorazione / pronto / in scadenza), chip tag, chip bucket-proposto con accetta-al-volo, badge stato, input testo + nota con dettatura, bottoni (primario / secondario / distruttivo), bottom tab bar, azione "+", campo ricerca, stati vuoti, banner errore.

Mockup richiesti: Inbox, Dettaglio/Review, Libreria, Dettaglio bucket, Cerca, Cattura/Share, Crea bucket, Archivio — in chiaro e scuro.

**Esprimi i token in forma usabile dal codice** (es. un oggetto di design tokens, o classi NativeWind), così li passo direttamente a Claude Code.

---

## Microcopy e stati

Definisci anche la **voce dei testi**: voce attiva e nomi dal lato dell'utente ("Salva", non "Invia"), stesso nome dell'azione lungo tutto il flusso. Tratta vuoto / errore / elaborazione come momenti di **direzione**, non di umore: di' cosa fare. Sentence case, niente filler.

---

## Vincoli

Mobile-first iOS + Android: target touch ≥ 44pt, raggiungibilità a una mano, tab in basso. Accessibilità: contrasto adeguato, supporto al ridimensionamento del testo, focus visibile, rispetto di "riduci movimento".
