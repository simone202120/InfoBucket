# Piano 1 — Fix funzionali & polish base (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chiudere i sei difetti d'uso che oggi rendono InfoBucket un prototipo e dare il polish di base (microcopy italiano, skeleton, feedback), senza introdurre nuove dipendenze.

**Architecture:** App Expo/React Native. Tutto lo stile passa dal theme adapter (`app/src/theme/`). I nuovi helper di dati sono hook puri composti dagli hook esistenti; i nuovi elementi UI sono componenti del design system. Una modifica di configurazione Supabase (fuori dal codice) sblocca il login.

**Tech Stack:** TypeScript (strict), React Native, expo-router, Jest + @testing-library/react-native, Supabase JS.

**Riferimenti:** spec `docs/superpowers/specs/2026-06-23-app-polish-redesign-design.md`. Questo è il **Piano 1 di 3**; i piani 2 (token/temi/accento/icone/brand) e 3 (bold/micro-interazioni) seguono.

## Global Constraints

- TypeScript **strict** + `noUncheckedIndexedAccess`. Niente `any` non giustificato, niente `as` per zittire il compilatore.
- **Nessuno stile hardcoded** nei file applicativi: colori/spaziature/tipografia da `useTheme()`.
- **Microcopy in italiano**, sentence case, voce attiva, niente emoji. Stesso nome dell'azione lungo tutto il flusso.
- **Nessun segreto** nel client. Il client usa solo anon key + auth.
- Touch target ≥ **44pt**; rispettare "riduci movimento".
- Comandi eseguiti dentro `app/`: `npm test -- <pattern>`, `npm run typecheck`, `npm run lint`.
- Commit piccoli, messaggi in italiano, terminati con: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- A fine piano: `typecheck` e `lint` puliti, test verdi, `docs/CODE_MAP.md` aggiornato.

## Prerequisito (configurazione Supabase, fuori dal codice)

Sblocca il login (spec §3.1). Da fare una volta sul progetto Supabase prod:
- Auth → Providers → Email: **disattivare "Confirm email"**.
- Auth → URL Configuration: impostare un **Site URL** valido (non localhost).

Verifica manuale: registrazione di un nuovo account → si entra subito, senza email; riavvio app → si resta loggati. Nessun file di repo cambia per questo passo.

## File Structure

- Create `app/src/features/usePolling.ts` — polling mentre ci sono item in lavorazione.
- Create `app/src/features/useFocusRefetch.ts` — refetch al focus schermata.
- Create `app/src/theme/ToastProvider.tsx` — context + provider del toast.
- Create `app/src/theme/components/Toast.tsx` — vista del toast (presentazionale).
- Create `app/src/theme/components/TranscriptSheet.tsx` — sheet testo completo.
- Create `app/src/theme/components/AvatarMenu.tsx` — avatar iniziali + menu.
- Create `app/src/theme/components/ListSkeleton.tsx` — skeleton di lista.
- Modify `app/src/theme/index.ts` — esportare `ToastProvider`/`useToast`.
- Modify `app/src/theme/components/index.ts` — esportare nuovi componenti.
- Modify `app/src/theme/components/StatusBadge.tsx` — etichette IT.
- Modify `app/src/theme/components/ItemCard.tsx` — etichette IT, no countdown doppio, `PressableScale`.
- Modify `app/src/theme/components/AddButton.tsx` — label IT.
- Modify `app/app/_layout.tsx` — montare `ToastProvider`.
- Modify `app/app/(tabs)/index.tsx`, `library.tsx`, `search.tsx` — `AvatarMenu`, skeleton, focus/polling.
- Modify `app/app/bucket/[id].tsx` — skeleton, focus refetch.
- Modify `app/src/features/review/ReviewScreen.tsx` — toast+back su conferma, `TranscriptSheet` per ogni fonte.
- Tests affiancati in `__tests__/`.

---

### Task 1: Helper `usePolling`

**Files:**
- Create: `app/src/features/usePolling.ts`
- Test: `app/src/features/__tests__/usePolling.test.ts`

**Interfaces:**
- Produces: `usePolling(callback: () => void, options: { active: boolean; intervalMs?: number }): void` — esegue `callback` ogni `intervalMs` (default 5000) solo finché `active` è true; pulisce l'intervallo allo smontaggio o quando `active` diventa false.

- [ ] **Step 1: Write the failing test**

```ts
// app/src/features/__tests__/usePolling.test.ts
import { renderHook } from '@testing-library/react-native';
import { usePolling } from '../usePolling';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('chiama la callback a ogni intervallo quando attivo', () => {
  const cb = jest.fn();
  renderHook(() => usePolling(cb, { active: true, intervalMs: 1000 }));
  expect(cb).not.toHaveBeenCalled();
  jest.advanceTimersByTime(3000);
  expect(cb).toHaveBeenCalledTimes(3);
});

it('non chiama la callback quando inattivo', () => {
  const cb = jest.fn();
  renderHook(() => usePolling(cb, { active: false, intervalMs: 1000 }));
  jest.advanceTimersByTime(3000);
  expect(cb).not.toHaveBeenCalled();
});

it('ferma il polling allo smontaggio', () => {
  const cb = jest.fn();
  const { unmount } = renderHook(() => usePolling(cb, { active: true, intervalMs: 1000 }));
  jest.advanceTimersByTime(1000);
  expect(cb).toHaveBeenCalledTimes(1);
  unmount();
  jest.advanceTimersByTime(3000);
  expect(cb).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- usePolling`
Expected: FAIL ("Cannot find module '../usePolling'").

- [ ] **Step 3: Write minimal implementation**

```ts
// app/src/features/usePolling.ts
/**
 * Esegue `callback` a intervalli regolari finché `active` è true. Usato per
 * aggiornare le liste mentre ci sono item in lavorazione (processing→ready),
 * senza websocket. Si autospegne quando `active` diventa false o allo smontaggio.
 */
import { useEffect, useRef } from 'react';

export interface PollingOptions {
  active: boolean;
  intervalMs?: number;
}

export function usePolling(callback: () => void, { active, intervalMs = 5000 }: PollingOptions): void {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => saved.current(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- usePolling`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add app/src/features/usePolling.ts app/src/features/__tests__/usePolling.test.ts
git commit -m "Dati: hook usePolling per aggiornare le liste durante la lavorazione"
```

---

### Task 2: Helper `useFocusRefetch`

**Files:**
- Create: `app/src/features/useFocusRefetch.ts`
- Test: `app/src/features/__tests__/useFocusRefetch.test.ts`

**Interfaces:**
- Consumes: `useFocusEffect` da `expo-router`.
- Produces: `useFocusRefetch(refetch: () => void | Promise<void>): void` — invoca `refetch` ogni volta che la schermata torna in focus.

- [ ] **Step 1: Write the failing test**

```ts
// app/src/features/__tests__/useFocusRefetch.test.ts
import { renderHook } from '@testing-library/react-native';
import { useFocusRefetch } from '../useFocusRefetch';

// useFocusEffect di expo-router: in test eseguiamo subito la callback ricevuta.
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void | (() => void)) => cb(),
}));

it('chiama refetch al focus della schermata', () => {
  const refetch = jest.fn();
  renderHook(() => useFocusRefetch(refetch));
  expect(refetch).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useFocusRefetch`
Expected: FAIL ("Cannot find module '../useFocusRefetch'").

- [ ] **Step 3: Write minimal implementation**

```ts
// app/src/features/useFocusRefetch.ts
/**
 * Ricarica i dati quando la schermata torna in focus. Con expo-router le
 * schermate restano montate durante la navigazione: senza questo, tornando
 * indietro si vedrebbero dati vecchi finché non si fa pull-to-refresh.
 */
import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

export function useFocusRefetch(refetch: () => void | Promise<void>): void {
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useFocusRefetch`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/features/useFocusRefetch.ts app/src/features/__tests__/useFocusRefetch.test.ts
git commit -m "Dati: hook useFocusRefetch per ricaricare al focus della schermata"
```

---

### Task 3: Cablare freschezza dati nelle liste e nel dettaglio

**Files:**
- Modify: `app/app/(tabs)/index.tsx`
- Modify: `app/app/(tabs)/library.tsx`
- Modify: `app/app/bucket/[id].tsx`
- Modify: `app/src/features/review/ReviewScreen.tsx` (solo aggancio polling/focus; il resto in Task 8)

**Interfaces:**
- Consumes: `useFocusRefetch`, `usePolling` (Task 1-2); `useInbox`/`useLibrary`/`useBucketDetail`/`useItemDetail` esistenti.

- [ ] **Step 1: Aggiungere focus + polling alla Inbox**

In `app/app/(tabs)/index.tsx`, dentro `InboxScreen`, dopo `const { items, loading, refreshing, error, refetch } = useInbox();`:

```tsx
import { useFocusRefetch } from '@/features/useFocusRefetch';
import { usePolling } from '@/features/usePolling';
// ...
useFocusRefetch(refetch);
usePolling(refetch, { active: items.some((it) => it.status === 'processing') });
```

- [ ] **Step 2: Aggiungere focus refetch a Libreria e dettaglio bucket**

In `app/app/(tabs)/library.tsx` dopo `useLibrary()`: `useFocusRefetch(refetch);` (più gli import).
In `app/app/bucket/[id].tsx` dopo `useBucketDetail(bucketId)`: `useFocusRefetch(refetch);` (più gli import).

- [ ] **Step 3: Aggiungere focus + polling al dettaglio item**

In `app/src/features/review/ReviewScreen.tsx`, dentro `ReviewScreen`, dopo l'`useItemDetail(id)` aggiungere un refetch al focus e polling finché l'item è in lavorazione. Esporre prima `load`/`refetch` dall'hook: in `app/src/features/review/useItemDetail.ts` aggiungere `refetch: load` all'oggetto restituito e al tipo `ItemDetailState` (`refetch: () => Promise<void>`). Poi in `ReviewScreen`:

```tsx
import { useFocusRefetch } from '@/features/useFocusRefetch';
import { usePolling } from '@/features/usePolling';
// dentro ReviewScreen, dopo aver destrutturato anche `refetch`:
useFocusRefetch(refetch);
usePolling(refetch, { active: item?.status === 'processing' });
```

- [ ] **Step 4: Verificare typecheck e test esistenti**

Run: `npm run typecheck`
Expected: nessun errore.
Run: `npm test -- useItemDetail`
Expected: PASS (i test esistenti continuano a passare; `refetch` è additivo).

- [ ] **Step 5: Commit**

```bash
git add app/app/\(tabs\)/index.tsx app/app/\(tabs\)/library.tsx app/app/bucket/ app/src/features/review/
git commit -m "Dati: refetch al focus + polling durante la lavorazione (niente reload manuale)"
```

---

### Task 4: Toast (componente + provider)

**Files:**
- Create: `app/src/theme/components/Toast.tsx`
- Create: `app/src/theme/ToastProvider.tsx`
- Modify: `app/src/theme/index.ts` (esportare `ToastProvider`, `useToast`)
- Modify: `app/src/theme/components/index.ts` (esportare `Toast`)
- Modify: `app/app/_layout.tsx` (montare `ToastProvider` dentro `ThemeProvider`)
- Test: `app/src/theme/__tests__/ToastProvider.test.tsx`

**Interfaces:**
- Produces: `useToast(): { showToast(opts: { message: string }): void }`; `<ToastProvider>` che va montato sotto `<ThemeProvider>`.

- [ ] **Step 1: Write the failing test**

```tsx
// app/src/theme/__tests__/ToastProvider.test.tsx
import { createElement } from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { ToastProvider, useToast } from '../ToastProvider';

function Trigger() {
  const { showToast } = useToast();
  return createElement(Pressable, { onPress: () => showToast({ message: 'Salvato in «Cucina»' }) },
    createElement(Text, null, 'mostra'));
}

it('mostra il messaggio del toast quando richiesto', () => {
  render(
    createElement(ThemeProvider, null, createElement(ToastProvider, null, createElement(Trigger))),
  );
  expect(screen.queryByText('Salvato in «Cucina»')).toBeNull();
  fireEvent.press(screen.getByText('mostra'));
  expect(screen.getByText('Salvato in «Cucina»')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ToastProvider`
Expected: FAIL ("Cannot find module '../ToastProvider'").

- [ ] **Step 3: Write the Toast view**

```tsx
// app/src/theme/components/Toast.tsx
/**
 * Toast — feedback effimero di successo (es. "Salvato in «…»"). Presentazionale:
 * non gestisce la coda né i timer (lo fa ToastProvider). Stile dal tema.
 */
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { CheckIcon } from '@/theme/icons';

export interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps): JSX.Element {
  const t = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.toast,
        { backgroundColor: t.colors.textPrimary, borderRadius: t.radius.md, gap: t.space[3] },
        t.shadow.lg,
      ]}
    >
      <View style={[styles.ok, { backgroundColor: t.colors.primary, borderRadius: t.radius.pill }]}>
        <CheckIcon size={12} color={t.colors.textOnPrimary} />
      </View>
      <Text style={{ color: t.colors.surface, fontFamily: t.font.display, fontSize: t.type.body.size }}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14 },
  ok: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 4: Write the provider**

```tsx
// app/src/theme/ToastProvider.tsx
/**
 * Provider del toast: una sola fonte per il feedback effimero. `useToast` espone
 * `showToast`; il toast si nasconde da solo dopo qualche secondo. Va montato
 * sotto <ThemeProvider> e sopra le schermate.
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from './components/Toast';

const VISIBLE_MS = 2600;

interface ToastApi {
  showToast: (opts: { message: string }) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback<ToastApi['showToast']>(({ message: m }) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(m);
    timer.current = setTimeout(() => setMessage(null), VISIBLE_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message !== null ? (
        <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 24 }]}>
          <Toast message={message} />
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve essere usato dentro <ToastProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
});
```

> Nota: `Animated` non è usato in questa versione minimale (animazione di entrata rimandata al Piano 3); rimuovere l'import se il lint segnala inutilizzato.

- [ ] **Step 5: Esportare e montare**

In `app/src/theme/index.ts` aggiungere: `export { ToastProvider, useToast } from './ToastProvider';`
In `app/src/theme/components/index.ts` aggiungere: `export { Toast } from './Toast';`
In `app/app/_layout.tsx`, avvolgere il contenuto dentro `ThemeProvider` con `ToastProvider`:

```tsx
import { ThemeProvider, ToastProvider, useTheme } from '@/theme';
// ...
<ThemeProvider>
  <ToastProvider>
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  </ToastProvider>
</ThemeProvider>
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- ToastProvider`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/src/theme/ToastProvider.tsx app/src/theme/components/Toast.tsx app/src/theme/index.ts app/src/theme/components/index.ts app/app/_layout.tsx app/src/theme/__tests__/ToastProvider.test.tsx
git commit -m "Tema: Toast + ToastProvider per il feedback effimero"
```

---

### Task 5: Feedback alla conferma in bucket

**Files:**
- Modify: `app/src/features/review/ReviewScreen.tsx`
- Test: `app/src/features/review/__tests__/ReviewScreen.test.tsx`

**Interfaces:**
- Consumes: `useToast` (Task 4); `useRouter` (expo-router); `confirm` di `useItemDetail`.
- La `ConfirmBucket` ora notifica al genitore il nome del bucket di destinazione tramite il callback `onConfirm(target, displayName)`.

- [ ] **Step 1: Write the failing test**

```tsx
// aggiungere a app/src/features/review/__tests__/ReviewScreen.test.tsx
// (segue lo stile dei test esistenti del file; mocka useItemDetail e expo-router)
it('mostra un toast e torna indietro dopo la conferma in un bucket', async () => {
  // Arrange: item ready con un bucket esistente "Cucina", confirm risolve true.
  // (usare gli helper/mocks già presenti nel file di test)
  // Act: premere il chip del bucket "Cucina".
  // Assert: showToast chiamato con messaggio contenente "Cucina" e router.back chiamato.
});
```

> Nota per l'implementatore: completare il test riusando i mock già presenti nel file (mock di `./useItemDetail`, di `expo-router` con `useRouter` che ritorna `{ back: jest.fn() }`, e di `@/theme` `useToast`). Asserire `back` chiamato e `showToast` con `expect.objectContaining({ message: expect.stringContaining('Cucina') })`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ReviewScreen`
Expected: FAIL (toast/back non ancora invocati).

- [ ] **Step 3: Cablare toast + back**

In `app/src/features/review/ReviewScreen.tsx`:
- importare `useToast` da `@/theme`;
- in `ReviewScreen` ottenere `const { showToast } = useToast();` e `const router = useRouter();` (già presente);
- passare a `ReviewBody` un nuovo handler `onConfirm` che avvolge quello dell'hook:

```tsx
onConfirm={async (target, displayName) => {
  const ok = await confirm(target);
  if (ok) {
    showToast({ message: `Salvato in «${displayName}»` });
    router.back();
  }
  return ok;
}}
```

- aggiornare la firma di `ConfirmBucketProps.onConfirm` in `(target: ConfirmTarget, displayName: string) => Promise<boolean>` e, dentro `ConfirmBucket`, passare il nome a ogni chiamata:
  - proposta: `onConfirm(suggestion.target, suggestion.name)`
  - bucket esistente: `onConfirm({ kind: 'existing', bucketId: bucket.id }, bucket.name)`
  - nuovo: `onConfirm({ kind: 'new', name, description }, name)`
- propagare il tipo aggiornato anche in `ReviewBodyProps.onConfirm`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ReviewScreen`
Expected: PASS (nuovo test + quelli esistenti).

- [ ] **Step 5: Commit**

```bash
git add app/src/features/review/
git commit -m "Review: feedback alla conferma (toast \"Salvato in …\" + ritorno)"
```

---

### Task 6: Sheet trascrizione/testo per tutte le fonti

**Files:**
- Create: `app/src/theme/components/TranscriptSheet.tsx`
- Modify: `app/src/theme/components/index.ts` (export)
- Modify: `app/src/features/review/ReviewScreen.tsx`
- Test: `app/src/theme/components/__tests__/TranscriptSheet.test.tsx`

**Interfaces:**
- Produces: `<TranscriptSheet visible title text onClose />`.

- [ ] **Step 1: Write the failing test**

```tsx
// app/src/theme/components/__tests__/TranscriptSheet.test.tsx
import { createElement, type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { TranscriptSheet } from '../TranscriptSheet';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('mostra titolo e testo quando visibile', () => {
  const { getByText } = wrap(
    <TranscriptSheet visible title="Trascrizione" text="Testo completo qui." onClose={() => {}} />,
  );
  expect(getByText('Trascrizione')).toBeTruthy();
  expect(getByText('Testo completo qui.')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- TranscriptSheet`
Expected: FAIL ("Cannot find module '../TranscriptSheet'").

- [ ] **Step 3: Write the component**

```tsx
// app/src/theme/components/TranscriptSheet.tsx
/**
 * TranscriptSheet — pannello a tutta pagina che sale dal basso con il testo
 * estratto completo (trascrizione di un video o testo di un articolo), leggibile
 * in Newsreader. Stile dal tema.
 */
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { XIcon } from '@/theme/icons';

export interface TranscriptSheetProps {
  visible: boolean;
  title: string;
  text: string;
  onClose: () => void;
}

export function TranscriptSheet({ visible, title, text, onClose }: TranscriptSheetProps): JSX.Element {
  const t = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: t.gutter, paddingVertical: t.space[4] }}>
          <Text style={{ color: t.colors.textPrimary, fontFamily: t.font.displayBold, fontSize: t.type.heading.size, lineHeight: t.type.heading.lh }}>
            {title}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Chiudi" hitSlop={8} style={{ minWidth: t.touchMin, minHeight: t.touchMin, alignItems: 'flex-end', justifyContent: 'center' }}>
            <XIcon color={t.colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: t.gutter, paddingBottom: t.space[9] }}>
          <Text style={{ fontFamily: t.font.read, fontSize: t.type.read.size, lineHeight: t.type.read.lh, color: t.colors.textPrimary }}>
            {text}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
```

- [ ] **Step 4: Esportare e cablare in ReviewScreen**

In `app/src/theme/components/index.ts`: `export { TranscriptSheet } from './TranscriptSheet';`

In `app/src/features/review/ReviewScreen.tsx`:
- rimuovere `TRANSCRIBED_SOURCES`, `TRANSCRIPT_PREVIEW_CHARS`, la funzione `transcriptPreview` e il componente `TranscriptPreview`;
- nel `ReviewBody` calcolare il testo completo e l'etichetta:

```tsx
const raw = item.rawContent?.trim() ?? '';
const hasText = raw.length > 0;
const isAv = item.sourceType === 'youtube' || item.sourceType === 'reel' || item.sourceType === 'tiktok';
const textLabel = isAv ? 'trascrizione' : 'testo';
const [sheetOpen, setSheetOpen] = useState(false);
```

- al posto del vecchio blocco `{transcript ? <TranscriptPreview .../> : null}` inserire un pulsante che apre lo sheet (mostrato solo se `hasText`):

```tsx
{hasText ? (
  <Button variant="secondary" onPress={() => setSheetOpen(true)} accessibilityLabel={`Apri ${textLabel}`}>
    {isAv ? 'Apri trascrizione' : 'Apri testo'}
  </Button>
) : null}
```

- prima della chiusura del `KeyboardAvoidingView`/`ScrollView` montare lo sheet:

```tsx
<TranscriptSheet
  visible={sheetOpen}
  title={isAv ? 'Trascrizione' : 'Testo'}
  text={raw}
  onClose={() => setSheetOpen(false)}
/>
```

- aggiungere `TranscriptSheet` all'import da `@/theme/components` e assicurarsi che `useState` sia importato (già lo è).

- [ ] **Step 5: Run test + typecheck**

Run: `npm test -- TranscriptSheet`
Expected: PASS.
Run: `npm test -- ReviewScreen`
Expected: PASS (i test esistenti non dipendono dall'anteprima rimossa; in caso, aggiornarli per cercare il pulsante "Apri trascrizione/testo").
Run: `npm run typecheck`
Expected: nessun errore.

- [ ] **Step 6: Commit**

```bash
git add app/src/theme/components/TranscriptSheet.tsx app/src/theme/components/index.ts app/src/features/review/ app/src/theme/components/__tests__/TranscriptSheet.test.tsx
git commit -m "Review: sheet trascrizione/testo completo per tutte le fonti"
```

---

### Task 7: AvatarMenu e accesso alle Impostazioni

**Files:**
- Create: `app/src/theme/components/AvatarMenu.tsx`
- Modify: `app/src/theme/components/index.ts` (export)
- Modify: `app/app/(tabs)/index.tsx` (sostituire ingranaggio con AvatarMenu)
- Modify: `app/app/(tabs)/library.tsx`, `app/app/(tabs)/search.tsx` (aggiungere AvatarMenu nell'header)
- Test: `app/src/theme/components/__tests__/AvatarMenu.test.tsx`

**Interfaces:**
- Produces: `<AvatarMenu email={string | null} onOpenSettings={() => void} onSignOut={() => void} />` — pastiglia con iniziali; al tap apre un menu con "Impostazioni" ed "Esci".

- [ ] **Step 1: Write the failing test**

```tsx
// app/src/theme/components/__tests__/AvatarMenu.test.tsx
import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { AvatarMenu } from '../AvatarMenu';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('mostra le iniziali dell\'email', () => {
  const { getByText } = wrap(<AvatarMenu email="simo.lavoro@gmail.com" onOpenSettings={() => {}} onSignOut={() => {}} />);
  expect(getByText('SL')).toBeTruthy();
});

it('apre il menu e invoca le azioni', () => {
  const onOpenSettings = jest.fn();
  const { getByLabelText, getByText } = wrap(
    <AvatarMenu email="a@b.com" onOpenSettings={onOpenSettings} onSignOut={() => {}} />,
  );
  fireEvent.press(getByLabelText('Apri il menu account'));
  fireEvent.press(getByText('Impostazioni'));
  expect(onOpenSettings).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- AvatarMenu`
Expected: FAIL ("Cannot find module '../AvatarMenu'").

- [ ] **Step 3: Write the component**

```tsx
// app/src/theme/components/AvatarMenu.tsx
/**
 * AvatarMenu — pastiglia con le iniziali dell'email in alto a destra negli header.
 * Al tap apre un menu con Impostazioni ed Esci. Sostituisce l'accesso alle
 * Impostazioni via ingranaggio, rendendolo disponibile in ogni schermata.
 */
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

export interface AvatarMenuProps {
  email: string | null;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

/** Iniziali (max 2) dall'email: prima lettera dei primi due segmenti alfanumerici. */
function initialsOf(email: string | null): string {
  if (!email) return '·';
  const parts = email.split('@')[0]?.split(/[.\-_]+/).filter(Boolean) ?? [];
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
  return letters || email[0]?.toUpperCase() || '·';
}

export function AvatarMenu({ email, onOpenSettings, onSignOut }: AvatarMenuProps): JSX.Element {
  const t = useTheme();
  const [open, setOpen] = useState(false);

  const choose = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Apri il menu account"
        style={{ width: t.touchMin, height: t.touchMin, alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={{ width: 34, height: 34, borderRadius: t.radius.pill, backgroundColor: t.colors.primarySoft, borderWidth: 1, borderColor: t.colors.primarySoft2, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: t.font.displayBold, fontSize: t.type.bodySm.size, color: t.colors.primaryPress }}>
            {initialsOf(email)}
          </Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Chiudi il menu">
          <View style={[styles.sheet, { backgroundColor: t.colors.surfaceRaised, borderRadius: t.radius.lg, borderColor: t.colors.border }, t.shadow.lg]}>
            <MenuRow label="Impostazioni" onPress={() => choose(onOpenSettings)} color={t.colors.textPrimary} font={t.font.display} size={t.type.subheading.size} minH={t.touchMin} />
            <View style={{ height: 1, backgroundColor: t.colors.border }} />
            <MenuRow label="Esci" onPress={() => choose(onSignOut)} color={t.colors.danger} font={t.font.display} size={t.type.subheading.size} minH={t.touchMin} />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function MenuRow(props: { label: string; onPress: () => void; color: string; font: string; size: number; minH: number }): JSX.Element {
  return (
    <Pressable onPress={props.onPress} accessibilityRole="button" accessibilityLabel={props.label} style={{ minHeight: props.minH, justifyContent: 'center', paddingHorizontal: 16 }}>
      <Text style={{ fontFamily: props.font, fontSize: props.size, color: props.color }}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000033', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 64, paddingRight: 16 },
  sheet: { minWidth: 200, borderWidth: 1, overflow: 'hidden' },
});
```

- [ ] **Step 4: Esportare e cablare negli header**

In `app/src/theme/components/index.ts`: `export { AvatarMenu } from './AvatarMenu';`

In `app/app/(tabs)/index.tsx` (`InboxScreen`): rimuovere il `Pressable` dell'ingranaggio (`SettingsIcon`) e l'import `SettingsIcon`; tenere l'Archivio; aggiungere a destra l'avatar. Servono `useAuth` e `supabase` per l'email (come in `settings.tsx`) — più semplice: usare `useAuth()` per `user?.email` e `signOut`:

```tsx
import { useAuth } from '@/features/auth';
import { AvatarMenu } from '@/theme/components';
// ...
const { user, signOut } = useAuth();
// nell'header, nel gruppo azioni a destra, dopo l'icona Archivio:
<AvatarMenu
  email={user?.email ?? null}
  onOpenSettings={() => router.push('/settings')}
  onSignOut={() => void signOut()}
/>
```

In `app/app/(tabs)/library.tsx` e `search.tsx`: nell'header (riga del titolo) aggiungere `<AvatarMenu .../>` a destra con lo stesso cablaggio (`useAuth`, `router`). In `library.tsx` il bottone "Nuovo bucket" resta; mettere l'avatar accanto.

- [ ] **Step 5: Run test + typecheck**

Run: `npm test -- AvatarMenu`
Expected: PASS.
Run: `npm run typecheck`
Expected: nessun errore (rimuovere import inutilizzati come `SettingsIcon`).

- [ ] **Step 6: Commit**

```bash
git add app/src/theme/components/AvatarMenu.tsx app/src/theme/components/index.ts app/app/\(tabs\)/ app/src/theme/components/__tests__/AvatarMenu.test.tsx
git commit -m "Nav: avatar con menu (Impostazioni/Esci) in ogni schermata principale"
```

---

### Task 8: Microcopy in italiano + countdown singolo

**Files:**
- Modify: `app/src/theme/components/StatusBadge.tsx`
- Modify: `app/src/theme/components/ItemCard.tsx`
- Modify: `app/src/theme/components/AddButton.tsx`
- Modify: `app/src/theme/components/__tests__/StatusBadge.test.tsx`
- Modify: `app/src/theme/components/__tests__/ItemCard.test.tsx`

**Interfaces:**
- Nessuna firma cambia; cambiano solo le stringhe mostrate.

- [ ] **Step 1: Aggiornare i test alle etichette italiane**

In `StatusBadge.test.tsx` cambiare le `label` attese in: `processing → 'In lavorazione'`, `ready → 'Pronto'`, `saved → 'Salvato'`, `archived → 'Archiviato'`, `expiring → 'In scadenza'`. Nel test del children, sostituire `'In 3 days'` con `'Tra 3 giorni'` e `'Expiring'` con `'In scadenza'`.

In `ItemCard.test.tsx` aggiornare ogni asserzione su etichette inglesi (`'Article'`, `'Video'`, ecc.) con le italiane (`'Articolo'`, `'Video'`, `'Reel'`, `'Documento'`, `'Nota'`) e, se presente, la nota di processing con `'Riassumo · propongo un bucket…'`. Aggiungere un test che verifica che in stato `expiring` il countdown compaia **una sola volta** (nel badge), es. `expect(getAllByText(/Tra 3 giorni/).length).toBe(1)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- StatusBadge ItemCard`
Expected: FAIL (le stringhe italiane non esistono ancora).

- [ ] **Step 3: Tradurre StatusBadge**

In `app/src/theme/components/StatusBadge.tsx` sostituire `LABEL`:

```tsx
const LABEL: Record<BadgeStatus, string> = {
  processing: 'In lavorazione',
  ready: 'Pronto',
  saved: 'Salvato',
  archived: 'Archiviato',
  expiring: 'In scadenza',
};
```

- [ ] **Step 4: Tradurre ItemCard e togliere il countdown doppio**

In `app/src/theme/components/ItemCard.tsx`:
- `SOURCE_LABEL`:

```tsx
const SOURCE_LABEL: Record<SourceType, string> = {
  article: 'Articolo',
  youtube: 'Video',
  reel: 'Reel',
  tiktok: 'Reel',
  document: 'Documento',
  other: 'Nota',
};
```

- badge expiring: `{expiring && hasDaysLeft ? \`Tra ${daysLeft} giorni\` : undefined}`
- nota processing: `Riassumo · propongo un bucket…`
- **rimuovere** il blocco `decay` (la riga `In {daysLeft} days → Archive`) e il relativo stile `decay` se non più usato; il countdown resta solo nel badge.

- [ ] **Step 5: Tradurre AddButton**

In `app/src/theme/components/AddButton.tsx`: `accessibilityLabel={label ?? 'Aggiungi'}`.

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- StatusBadge ItemCard`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/src/theme/components/StatusBadge.tsx app/src/theme/components/ItemCard.tsx app/src/theme/components/AddButton.tsx app/src/theme/components/__tests__/
git commit -m "Microcopy: etichette in italiano e countdown singolo nella card"
```

---

### Task 9: Skeleton di lista al primo caricamento

**Files:**
- Create: `app/src/theme/components/ListSkeleton.tsx`
- Modify: `app/src/theme/components/index.ts` (export)
- Modify: `app/app/(tabs)/index.tsx`, `library.tsx`, `search.tsx`, `app/app/bucket/[id].tsx`
- Test: `app/src/theme/components/__tests__/ListSkeleton.test.tsx`

**Interfaces:**
- Produces: `<ListSkeleton count?={number} />` — placeholder a card multiple per il primo caricamento.

- [ ] **Step 1: Write the failing test**

```tsx
// app/src/theme/components/__tests__/ListSkeleton.test.tsx
import { createElement, type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { ListSkeleton } from '../ListSkeleton';

const wrap = (n: ReactNode) => render(createElement(ThemeProvider, null, n));

it('rende il numero richiesto di placeholder', () => {
  const { getAllByLabelText } = wrap(<ListSkeleton count={3} />);
  expect(getAllByLabelText('Caricamento')).toHaveLength(3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ListSkeleton`
Expected: FAIL ("Cannot find module '../ListSkeleton'").

- [ ] **Step 3: Write the component**

```tsx
// app/src/theme/components/ListSkeleton.tsx
/**
 * ListSkeleton — placeholder a card per il primo caricamento di una lista, al
 * posto di uno spinner nudo. Stile dal tema; statico (lo shimmer animato arriva
 * nel Piano 3, dopo l'estensione del motion).
 */
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';

const ROWS = ['100%', '92%', '64%'] as const;

export interface ListSkeletonProps {
  count?: number;
}

export function ListSkeleton({ count = 4 }: ListSkeletonProps): JSX.Element {
  const t = useTheme();
  return (
    <View style={{ gap: t.space[4] }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          accessibilityLabel="Caricamento"
          style={[{ backgroundColor: t.colors.surface, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.colors.border, padding: t.gutter, gap: t.space[3] }, t.shadow.sm]}
        >
          {ROWS.map((w, j) => (
            <View key={j} style={[styles.line, { width: w, backgroundColor: t.colors.bgSunken }]} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ line: { height: 12, borderRadius: 6 } });
```

- [ ] **Step 4: Esportare e usare al posto degli spinner**

In `app/src/theme/components/index.ts`: `export { ListSkeleton } from './ListSkeleton';`

In `index.tsx`, `library.tsx`, `search.tsx`, `bucket/[id].tsx`: dove ora c'è `loading && <lista vuota> ? <ActivityIndicator/> : <FlatList/>`, sostituire il ramo di caricamento con la skeleton dentro il padding di lista. Esempio per la Inbox:

```tsx
{loading && items.length === 0 ? (
  <View style={{ padding: t.gutter }}>
    <ListSkeleton />
  </View>
) : (
  <FlatList ... />
)}
```

Aggiornare gli import (`ListSkeleton` da `@/theme/components`); rimuovere `ActivityIndicator` se non più usato nel file.

- [ ] **Step 5: Run test + typecheck**

Run: `npm test -- ListSkeleton`
Expected: PASS.
Run: `npm run typecheck`
Expected: nessun errore.

- [ ] **Step 6: Commit**

```bash
git add app/src/theme/components/ListSkeleton.tsx app/src/theme/components/index.ts app/app/\(tabs\)/ app/app/bucket/ app/src/theme/components/__tests__/ListSkeleton.test.tsx
git commit -m "UI: skeleton di lista al primo caricamento (al posto dello spinner)"
```

---

### Task 10: ItemCard con feedback al tocco (PressableScale)

**Files:**
- Modify: `app/src/theme/components/ItemCard.tsx`
- Modify: `app/src/theme/components/__tests__/ItemCard.test.tsx` (verifica che onPress funzioni ancora)

**Interfaces:**
- Nessuna firma cambia.

- [ ] **Step 1: Aggiornare il test del tocco (se necessario)**

Assicurarsi che il test esistente di `ItemCard` con `onPress` continui a trovare l'elemento premibile (cercare per `accessibilityRole="button"` o testo del summary e fare `fireEvent.press`). Se il test si basava sul tipo `Pressable`, adeguarlo a premere l'elemento con ruolo "button".

- [ ] **Step 2: Sostituire Pressable con PressableScale**

In `app/src/theme/components/ItemCard.tsx`, nel ramo `if (onPress)`, usare `PressableScale` (già esportato da `@/theme`) al posto di `Pressable`:

```tsx
import { PressableScale, useTheme, type Theme } from '@/theme';
// ...
if (onPress) {
  return (
    <PressableScale accessibilityRole="button" onPress={onPress} style={cardStyle}>
      {content}
    </PressableScale>
  );
}
```

Rimuovere `Pressable` dall'import di `react-native` se non più usato.

- [ ] **Step 3: Run test + typecheck + lint**

Run: `npm test -- ItemCard`
Expected: PASS.
Run: `npm run typecheck && npm run lint`
Expected: nessun errore/warning.

- [ ] **Step 4: Commit**

```bash
git add app/src/theme/components/ItemCard.tsx app/src/theme/components/__tests__/ItemCard.test.tsx
git commit -m "ItemCard: feedback tattile al tocco (PressableScale)"
```

---

### Task 11: Verifica finale e CODE_MAP

**Files:**
- Modify: `docs/CODE_MAP.md`

- [ ] **Step 1: Suite completa**

Run: `npm test`
Expected: tutti verdi.
Run: `npm run typecheck && npm run lint`
Expected: nessun errore/warning.

- [ ] **Step 2: Aggiornare CODE_MAP**

In `docs/CODE_MAP.md` aggiungere i nuovi moduli: `features/usePolling`, `features/useFocusRefetch`, `theme/ToastProvider`, componenti `Toast`, `TranscriptSheet`, `AvatarMenu`, `ListSkeleton`; e annotare che le liste si aggiornano al focus + polling e che le Impostazioni si raggiungono dall'avatar.

- [ ] **Step 3: Commit**

```bash
git add docs/CODE_MAP.md
git commit -m "Docs: CODE_MAP riflette i fix funzionali e i nuovi componenti"
```

---

## Self-Review

**Spec coverage (vs spec §3 e §3.6):**
- §3.1 Login → Prerequisito (config) + nota safety-net non codificata (la rete di sicurezza "controlla la mail" è rinviata: con conferma email disattivata non serve; va nel Piano 2 se la si vuole esplicita). ✔ con riserva documentata.
- §3.2 Freschezza → Task 1-3. ✔
- §3.3 Feedback conferma → Task 4-5. ✔
- §3.4 Trascrizione → Task 6. ✔
- §3.5 Impostazioni/avatar → Task 7. ✔
- §3.6 Polish (microcopy, skeleton, pressable, countdown) → Task 8-10. ✔

**Placeholder scan:** il solo punto "morbido" è lo Step 1 del Task 5 (test da completare riusando i mock del file esistente): è guidato con istruzioni precise perché dipende da helper locali non visibili qui. Tutti gli altri step hanno codice completo.

**Type consistency:** `usePolling`/`useFocusRefetch`/`useToast`/`showToast`/`TranscriptSheet`/`AvatarMenu`/`ListSkeleton` usati con le stesse firme con cui sono definiti; `useItemDetail` estende `ItemDetailState` con `refetch` prima di usarlo (Task 3).

## Note di handoff
- La **rete di sicurezza login** ("controlla la mail") è stata volutamente esclusa da questo piano perché, disattivata la conferma email, è codice non necessario (YAGNI). Se in futuro si riattiva la conferma, aggiungerla allora.
- Lo **shimmer animato** dello skeleton e l'**animazione di entrata** del toast sono rimandati al Piano 3 (motion), per non introdurre qui logica di animazione non ancora condivisa.
