# Piano 3 — Aggiunte bold & micro-interazioni (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portare InfoBucket da "app curata" a "app viva": lettura immersiva del dettaglio, Inbox raggruppata, gesti swipe sulle card con azioni rapide, feedback aptico, e una regia di motion coerente (entrata del toast, shimmer dello skeleton, "draw-in" della barra di provenienza).

**Architecture:** Tutto via theme adapter. Le micro-interazioni "leggere" restano sull'API `Animated` nativa già usata in `motion.tsx`. Lo swipe richiede `react-native-gesture-handler` e l'aptico `expo-haptics` (uniche nuove dipendenze, isolate dietro piccoli wrapper). Le azioni di lista sfruttano una nuova mutation `archiveItem` lato `@/lib/items`.

**Tech Stack:** TypeScript (strict), React Native, expo-router, `react-native-gesture-handler` (nuovo), `expo-haptics` (nuovo), Jest + @testing-library/react-native.

**Riferimenti:** spec `docs/superpowers/specs/2026-06-23-app-polish-redesign-design.md` (§5, §6). Piano **3 di 3**. Presuppone Piani 1 e 2 completati (Toast, ItemCard con rail, freschezza dati, ScreenHeader).

## Global Constraints

- TypeScript **strict** + `noUncheckedIndexedAccess`. Niente `any`/`as` per zittire il compilatore.
- **Nessuno stile hardcoded** (tutto da `useTheme()`); **rispetto di "riduci movimento"** su OGNI animazione (riusare `useReducedMotion()` da `motion.tsx`).
- **Aptico opzionale e isolato**: un solo wrapper `haptics.ts`; nessuna chiamata diretta a `expo-haptics` sparsa nei componenti. Mai bloccante.
- **Dipendenze nuove minime e giustificate**: solo `react-native-gesture-handler` e `expo-haptics`. Installare con la versione compatibile Expo (`npx expo install`).
- **Gesti accessibili**: ogni azione raggiungibile anche senza swipe (lo swipe è una scorciatoia, non l'unico modo). Touch ≥ 44pt.
- Comandi da `app/`: `npm test -- <pattern>`, `npm run typecheck`, `npm run lint`.
- Commit piccoli, messaggi in italiano, trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## File Structure

- Modify `app/package.json` — aggiungere `react-native-gesture-handler`, `expo-haptics` (via `npx expo install`).
- Modify `app/app/_layout.tsx` — avvolgere l'app in `GestureHandlerRootView`.
- Create `app/src/theme/haptics.ts` — wrapper aptico (success/light), no-op se non disponibile.
- Modify `app/src/lib/items.ts` — `archiveItem(id)` mutation.
- Modify `app/src/theme/components/ItemCard.tsx` — supporto azioni swipe (Archivia / Rivedi).
- Modify `app/app/(tabs)/index.tsx` — passare le azioni swipe + raggruppamento "In scadenza / Recenti".
- Modify `app/src/features/inbox/useInbox.ts` o nuova util — raggruppamento puro.
- Modify `app/src/features/review/ReviewScreen.tsx` — modalità lettura immersiva (riassunto eroe).
- Modify `app/src/theme/ToastProvider.tsx` — animazione di entrata/uscita del toast.
- Modify `app/src/theme/components/ListSkeleton.tsx` — shimmer animato.
- Modify `app/src/theme/components/ItemCard.tsx` — "draw-in" della rail all'ingresso.
- Tests affiancati.

---

### Task 1: Dipendenze gesti/aptico + GestureHandlerRootView

**Files:**
- Modify: `app/package.json` (via comando)
- Modify: `app/app/_layout.tsx`

**Interfaces:**
- Produces: app avvolta in `GestureHandlerRootView` (necessario per `react-native-gesture-handler`).

- [ ] **Step 1: Installare le dipendenze**

Run (da `app/`): `npx expo install react-native-gesture-handler expo-haptics`
Expected: aggiunte a `package.json` con versioni compatibili con l'Expo SDK del progetto.

- [ ] **Step 2: Avvolgere l'app**

In `app/app/_layout.tsx`, importare `import { GestureHandlerRootView } from 'react-native-gesture-handler';` e avvolgere il contenuto del `RootLayout` (il più esterno, attorno a `SafeAreaProvider`) in `<GestureHandlerRootView style={{ flex: 1 }}>…</GestureHandlerRootView>`.

- [ ] **Step 3: Verifica build/test**

Run: `npm test` → la suite esistente resta verde (nessuna logica cambiata).
Run: `npm run typecheck` → nessun errore.

- [ ] **Step 4: Commit**

```bash
git add app/package.json app/package-lock.json app/app/_layout.tsx
git commit -m "Deps: gesture-handler + expo-haptics; GestureHandlerRootView"
```

---

### Task 2: Wrapper aptico

**Files:**
- Create: `app/src/theme/haptics.ts`
- Test: `app/src/theme/__tests__/haptics.test.ts`

**Interfaces:**
- Produces: `haptics.success(): void`, `haptics.light(): void` — invocano `expo-haptics`; non lanciano mai (try/catch), no-op se l'API fallisce.

- [ ] **Step 1: Write the failing test**

```ts
// app/src/theme/__tests__/haptics.test.ts
import * as Haptics from 'expo-haptics';
import { haptics } from '../haptics';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light' },
}));

it('success invoca notificationAsync', () => {
  haptics.success();
  expect((Haptics.notificationAsync as jest.Mock)).toHaveBeenCalled();
});

it('non lancia se l\'API fallisce', () => {
  (Haptics.impactAsync as jest.Mock).mockImplementationOnce(() => { throw new Error('no haptics'); });
  expect(() => haptics.light()).not.toThrow();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- haptics`
Expected: FAIL ("Cannot find module '../haptics'").

- [ ] **Step 3: Implement**

```ts
// app/src/theme/haptics.ts
/**
 * Wrapper aptico: un solo punto che conosce expo-haptics. Le chiamate sono
 * "fire and forget" e non lanciano mai (un telefono senza motore aptico, o un
 * errore dell'API, non deve mai rompere il flusso).
 */
import * as Haptics from 'expo-haptics';

export const haptics = {
  success(): void {
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      /* aptico non disponibile: ignora */
    }
  },
  light(): void {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* aptico non disponibile: ignora */
    }
  },
};
```

- [ ] **Step 4: Cablare i punti chiave**

- In `app/src/features/review/ReviewScreen.tsx`, nel wrapper `onConfirm` (Piano 1), dopo il `showToast` aggiungere `haptics.success();`.
- In `app/src/theme/components/BucketChip.tsx` (accetta-al-volo) chiamare `haptics.light()` nell'`onAccept`, se presente — oppure lasciarlo al chiamante. (Verificare dove vive l'accept; mantenere una sola chiamata.)

- [ ] **Step 5: Run test + typecheck**

Run: `npm test -- haptics ReviewScreen` → PASS.
Run: `npm run typecheck` → nessun errore.

- [ ] **Step 6: Commit**

```bash
git add app/src/theme/haptics.ts app/src/theme/__tests__/haptics.test.ts app/src/features/review/ReviewScreen.tsx
git commit -m "Aptico: wrapper haptics + feedback sulla conferma"
```

---

### Task 3: Mutation `archiveItem` + azioni swipe sulla ItemCard

**Files:**
- Modify: `app/src/lib/items.ts`
- Test: `app/src/lib/__tests__/items-mutations.test.ts` (estendere)
- Modify: `app/src/theme/components/ItemCard.tsx`
- Modify: `app/app/(tabs)/index.tsx`
- Test: `app/src/theme/components/__tests__/ItemCard.test.tsx` (estendere)

**Interfaces:**
- `archiveItem(id: string): Promise<Item>` — imposta `status='archived'`, `archived_at=now()` e ritorna l'item mappato (stesso pattern delle altre mutation in `items.ts`).
- `ItemCard` accetta `onArchive?: () => void` e `onReview?: () => void`; quando definiti, abilita lo swipe (Swipeable di gesture-handler) con azione sinistra "Archivia" e destra "Rivedi". Senza i prop, resta una card normale (retrocompatibile).

- [ ] **Step 1: Write the failing test (archiveItem)**

```ts
// estendere app/src/lib/__tests__/items-mutations.test.ts seguendo lo stile esistente:
// mocka il client supabase (update().eq().select().single()), verifica che
// archiveItem('i1') invii status 'archived' + archived_at non null e ritorni l'item mappato.
it('archiveItem imposta lo stato archived e la data', async () => {
  // arrange il mock di supabase come negli altri test del file
  // act: const res = await archiveItem('i1');
  // assert: update chiamato con { status: 'archived', archived_at: <ISO> }; res.status === 'archived'
});
```
(Completare riusando i mock già presenti nel file di test delle mutation.)

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- items-mutations`
Expected: FAIL (`archiveItem` non esiste).

- [ ] **Step 3: Implement archiveItem**

In `app/src/lib/items.ts`, aggiungere accanto alle altre mutation (seguire ESATTAMENTE il pattern di `confirmItem`/`updateItem` per client, `.update(...).eq('id', id).select(...).single()`, mappatura con il mapper esistente, gestione errori):
```ts
/** Sposta l'item in archivio (decadimento manuale). */
export async function archiveItem(id: string): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) throw new ItemsError(error?.message ?? 'Impossibile archiviare.');
  return mapItemRow(data);
}
```
(Allineare nomi import `ItemsError`/`mapItemRow`/`supabase` a quelli realmente usati nel file.)

- [ ] **Step 4: Write the failing test (ItemCard swipe)**

```tsx
// in ItemCard.test.tsx
it('espone le azioni Archivia e Rivedi quando i prop swipe sono passati', () => {
  const onArchive = jest.fn();
  const onReview = jest.fn();
  const { getByLabelText } = renderInTheme(
    <ItemCard source="article" summary="x" onPress={() => {}} onArchive={onArchive} onReview={onReview} />,
  );
  fireEvent.press(getByLabelText('Archivia'));
  expect(onArchive).toHaveBeenCalled();
});
```
(Le azioni Swipeable di gesture-handler sono renderizzate come bottoni accessibili nelle "render actions"; il test preme il bottone azione per label, senza simulare il gesto.)

- [ ] **Step 5: Run to verify it fails**

Run: `npm test -- ItemCard`
Expected: FAIL (nessuna azione "Archivia").

- [ ] **Step 6: Implement swipe in ItemCard**

In `app/src/theme/components/ItemCard.tsx`:
- importare `Swipeable` da `react-native-gesture-handler`;
- aggiungere prop opzionali `onArchive?: () => void` e `onReview?: () => void`;
- se `onArchive || onReview`, avvolgere la card in `<Swipeable>` con `renderRightActions`/`renderLeftActions` che mostrano `Pressable` accessibili ("Archivia" con `TrashIcon`/icona archivio, "Rivedi"), ciascuno con `accessibilityLabel`, sfondo dai token (`status.archivedSoft`/`primarySoft`), touch ≥44pt; rispettare `useReducedMotion()` non disabilita lo swipe ma evita animazioni extra;
- mantenere il comportamento attuale (PressableScale + onPress) come contenuto.

- [ ] **Step 7: Cablare nella Inbox**

In `app/app/(tabs)/index.tsx`, su `InboxItem`/`ItemCard` passare:
- `onReview={() => router.push(\`/item/${item.id}\`)}`
- `onArchive={async () => { await archiveItem(item.id); haptics.success(); await refetch(); }}` (import `archiveItem` da `@/lib/items`, `haptics` da `@/theme/haptics`). Gestire errori con l'`ErrorBanner` esistente o un toast.

- [ ] **Step 8: Run tests + typecheck + lint**

Run: `npm test -- items-mutations ItemCard` → PASS.
Run: `npm run typecheck && npm run lint` → puliti.

- [ ] **Step 9: Commit**

```bash
git add app/src/lib/items.ts app/src/lib/__tests__/items-mutations.test.ts app/src/theme/components/ItemCard.tsx app/app/\(tabs\)/index.tsx app/src/theme/components/__tests__/ItemCard.test.tsx
git commit -m "Inbox: swipe sulle card (Archivia/Rivedi) + archiveItem"
```

---

### Task 4: Inbox raggruppata (In scadenza / Recenti)

**Files:**
- Create: `app/src/features/inbox/groupInbox.ts`
- Test: `app/src/features/inbox/__tests__/groupInbox.test.ts`
- Modify: `app/app/(tabs)/index.tsx`

**Interfaces:**
- `groupInbox(items: Item[], now?: number): { expiring: Item[]; recent: Item[] }` — separa gli item in scadenza (via `isExpiring`) dal resto, preservando l'ordine.

- [ ] **Step 1: Write the failing test**

```ts
// app/src/features/inbox/__tests__/groupInbox.test.ts
import { groupInbox } from '../groupInbox';
import type { Item } from '@/types/domain';
// helper item(over) come negli altri test
it('separa gli item in scadenza dai recenti mantenendo l\'ordine', () => {
  // arrange: due item, uno con createdAt vecchio (expiring), uno nuovo
  // act: const { expiring, recent } = groupInbox([a, b], NOW)
  // assert: expiring contiene a, recent contiene b
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- groupInbox`
Expected: FAIL ("Cannot find module '../groupInbox'").

- [ ] **Step 3: Implement**

```ts
// app/src/features/inbox/groupInbox.ts
/**
 * Raggruppa gli item della Inbox in "in scadenza" e "recenti", per dare ritmo
 * alla lista e mettere in evidenza ciò che sta per decadere. Funzione pura.
 */
import { isExpiring } from '@/lib/lifecycle';
import type { Item } from '@/types/domain';

export interface InboxGroups {
  expiring: Item[];
  recent: Item[];
}

export function groupInbox(items: Item[], now: number = Date.now()): InboxGroups {
  const expiring: Item[] = [];
  const recent: Item[] = [];
  for (const item of items) {
    if (item.status !== 'processing' && isExpiring(item, now)) expiring.push(item);
    else recent.push(item);
  }
  return { expiring, recent };
}
```

- [ ] **Step 4: Usare le sezioni nella Inbox**

In `app/app/(tabs)/index.tsx`, sostituire la `FlatList` con una `SectionList` (o costruire sezioni e usare `FlatList` con header) basata su `groupInbox(items)`: sezione "In scadenza" (solo se non vuota) e "Recenti". Riusare lo stesso `InboxItem`. Header di sezione con stile mono coerente (come l'occhiello dell'header). Mantenere `RefreshControl`, `FadeInUp`, `staggerDelay`, `ListEmptyComponent` (quando entrambe vuote) e lo skeleton di caricamento.

- [ ] **Step 5: Run test + typecheck + lint**

Run: `npm test -- groupInbox` → PASS.
Run: `npm run typecheck && npm run lint` → puliti.

- [ ] **Step 6: Commit**

```bash
git add app/src/features/inbox/groupInbox.ts app/src/features/inbox/__tests__/groupInbox.test.ts app/app/\(tabs\)/index.tsx
git commit -m "Inbox: sezioni In scadenza / Recenti"
```

---

### Task 5: Lettura immersiva del dettaglio item

**Files:**
- Modify: `app/src/features/review/ReviewScreen.tsx`
- Test: `app/src/features/review/__tests__/ReviewScreen.test.tsx` (estendere)

**Interfaces:**
- Nuovo stato locale `mode: 'read' | 'edit'` in `ReviewBody`; di default `read`. In lettura, il riassunto è una citazione grande (Newsreader, `type.title`/`readLg`), con un'azione "Modifica" che passa in `edit` (l'attuale UI editabile). Le azioni principali (Salva in bucket, Apri testo) restano raggiungibili in basso.

- [ ] **Step 1: Write the failing test**

```tsx
// in ReviewScreen.test.tsx
it('apre in modalità lettura con il riassunto in evidenza e un\'azione Modifica', async () => {
  getItemMock.mockResolvedValue(item({ summary: 'Un riassunto eroe' }));
  listBucketsMock.mockResolvedValue([]);
  const { getByText } = wrap(<ReviewScreen id="i1" />);
  await waitFor(() => expect(getByText('Un riassunto eroe')).toBeTruthy());
  expect(getByText('Modifica')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- ReviewScreen`
Expected: FAIL (nessun pulsante "Modifica" / il summary è già in TextInput).

- [ ] **Step 3: Implement reading mode**

In `app/src/features/review/ReviewScreen.tsx`, dentro `ReviewBody`:
- aggiungere `const [mode, setMode] = useState<'read' | 'edit'>('read');`
- in `read`: rendere il riassunto come `Text` grande (Newsreader, `fontSize: t.type.title.size` o `readLg`, lineHeight generoso), non come `TextInput`; mostrare i tag in sola lettura; un `Button variant="ghost"` "Modifica" che fa `setMode('edit')`. Le sezioni Salva in bucket / Apri testo / Elimina restano visibili.
- in `edit`: l'attuale UI editabile (TextInput summary, tag editabili, Salva/Rigenera). Un "Fatto" torna a `read` dopo `onSave`.
- preservare tutta la logica esistente (dirty, save, regenerate, confirm, remove). Nessun cambiamento ai dati.

- [ ] **Step 4: Run tests + typecheck + lint**

Run: `npm test -- ReviewScreen` → PASS (nuovo + esistenti; aggiornare i test esistenti che assumevano il summary editabile subito, facendoli prima entrare in `edit` se necessario).
Run: `npm run typecheck && npm run lint` → puliti.

- [ ] **Step 5: Commit**

```bash
git add app/src/features/review/
git commit -m "Review: modalità lettura immersiva (riassunto eroe) + Modifica"
```

---

### Task 6: Regia di motion (toast, shimmer, rail draw-in)

**Files:**
- Modify: `app/src/theme/ToastProvider.tsx`
- Modify: `app/src/theme/components/ListSkeleton.tsx`
- Modify: `app/src/theme/components/ItemCard.tsx`
- Test: aggiornare/aggiungere asserzioni leggere dove sensato

**Interfaces:**
- Nessuna firma pubblica cambia; solo animazioni interne, tutte con fallback "riduci movimento".

- [ ] **Step 1: Animazione di entrata/uscita del toast**

In `app/src/theme/ToastProvider.tsx`, far comparire il toast con un fade+slide dal basso (API `Animated`), e svanire prima dello smontaggio. Usare `useReducedMotion()`: se attivo, comparsa/sparizione immediate. Mantenere il timer e il cleanup del Piano 1.

- [ ] **Step 2: Shimmer dello skeleton**

In `app/src/theme/components/ListSkeleton.tsx`, animare le righe con uno shimmer (gradiente che scorre o opacità pulsante via `Animated.loop`). Con "riduci movimento": statico (lo stato attuale). Estrarre eventuali numeri in costanti (chiude il Minor del Piano 1).

- [ ] **Step 3: "Draw-in" della rail**

In `app/src/theme/components/ItemCard.tsx`, far "disegnare" la barra di provenienza dall'alto verso il basso alla comparsa (scaleY 0→1 con origine in alto, via `Animated`), sincronizzata col `FadeInUp` della lista. Con "riduci movimento": rail già piena.

- [ ] **Step 4: Verifica**

Run: `npm test -- ToastProvider ListSkeleton ItemCard` → PASS (le animazioni non devono rompere le asserzioni esistenti; verificare che i contenuti restino presenti).
Run: `npm run typecheck && npm run lint` → puliti.

- [ ] **Step 5: Commit**

```bash
git add app/src/theme/ToastProvider.tsx app/src/theme/components/ListSkeleton.tsx app/src/theme/components/ItemCard.tsx
git commit -m "Motion: entrata toast, shimmer skeleton, draw-in della rail"
```

---

### Task 7: Verifica finale + CODE_MAP

**Files:**
- Modify: `docs/CODE_MAP.md`

- [ ] **Step 1: Suite completa**

Run: `npm test` → tutti verdi.
Run: `npm run typecheck && npm run lint` → nessun errore/warning.

- [ ] **Step 2: Aggiornare CODE_MAP**

Aggiungere: `theme/haptics.ts`, `features/inbox/groupInbox.ts`, `archiveItem` in `lib/items`; annotare swipe sulle card, Inbox a sezioni, lettura immersiva, e le animazioni (toast/shimmer/rail). Citare le nuove dipendenze `react-native-gesture-handler` ed `expo-haptics`.

- [ ] **Step 3: Commit**

```bash
git add docs/CODE_MAP.md
git commit -m "Docs: CODE_MAP riflette bold + micro-interazioni"
```

---

## Self-Review

**Spec coverage (vs spec §5, §6):**
- §5 lettura immersiva → Task 5. ✔
- §5 inbox raggruppata → Task 4. ✔
- §5 swipe sulle card → Task 3. ✔
- §6 haptics → Task 2. ✔
- §6 entrata toast, shimmer, draw-in, transizioni → Task 6. ✔
- §6 scala al tocco / entrata sfalsata / tab pill → già presenti dai Piani precedenti.

**Placeholder scan:** tre punti sono guidati ma non incollati interi, perché dipendono da codice locale non visibile qui: il test di `archiveItem` (Task 3 Step 1) e quello di `groupInbox` (Task 4 Step 1) vanno completati riusando gli helper dei rispettivi file di test; la `renderRightActions` dello Swipeable (Task 3 Step 6) e la UI di lettura (Task 5 Step 3) sono descritte con i requisiti esatti ma il markup finale lo compone l'implementatore seguendo i pattern del file. Tutti gli altri step hanno codice completo.

**Type consistency:** `haptics`, `archiveItem`, `groupInbox`/`InboxGroups` usati con le firme con cui sono definiti. `ItemCard` estesa con `onArchive`/`onReview` opzionali prima dell'uso nella Inbox.

## Rischi
- **Nuove dipendenze native** (gesture-handler): richiedono un rebuild del dev client / APK EAS, non solo Metro. Verificare con un build prima di considerare chiuso il piano.
- **Swipe + SectionList**: testare che lo Swipeable non interferisca con lo scroll verticale (gesture-handler lo gestisce, ma va provato su device).
- **`archiveItem` e RLS**: l'update passa dal client con anon key → assicurarsi che la RLS consenta all'utente di archiviare i propri item (probabile, ma da verificare; in caso contrario, va spostato lato server).
