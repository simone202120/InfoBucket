# InfoBucket — Design System

A documented, implementation-ready design system for **InfoBucket**, a personal
mobile app (iOS + Android, React Native / Expo) for **calm triage and instant
retrieval** of things you save — articles, videos, reels and documents. One
person uses it at the end of the day to clear a queue of captured fragments and
to find them again later.

The **summary is the hero** of every screen. Two structural signals drive the
whole visual language — they are *information*, never decoration:

- **Source / provenance** — article · video · reel · document · note
- **Status / lifecycle** — processing · ready · saved · archived · expiring

> Working name. This system is the deliverable to hand to Claude Code: tokens,
> components, and high-fidelity mockups in light **and** dark.

---

## Sources

This system was built from the product brief (`uploads/infobucket-design-brief.md`,
in Italian) plus the project repository:

- **GitHub:** https://github.com/simone202120/InfoBucket

> At the time of writing the repo contained only a stub `README.md` — there was
> **no existing UI code or design tokens to mirror**, so the visual direction
> below is an original position taken for this app (not extracted from a
> codebase). If you later add screens or tokens to that repo, re-run this system
> against them so the components track the real implementation. Explore the repo
> to ground future iterations.

---

## The position — "Living Archive"

A calm reading room, not a feed. The brief explicitly bans three AI-default
looks; this system avoids all three:

| Banned default | What we do instead |
|---|---|
| Warm cream + high-contrast serif + terracotta | **Cool ink-slate** neutrals on paper; a *low-contrast reading* serif (Newsreader) only for body |
| Near-black + a single acid accent | **A calm olive green** for action (a user-selectable accent); amber used *only* for aging |
| Newspaper rules, zero radii, dense columns | **Generous radii**, soft elevation, one idea per card |

**Signature element: provenance.** Every captured item leads with a **source
stamp** — a tinted glyph square in its origin's own hue. The boldness lives
here; everything else stays quiet. Freshness/decay is handled with a single
restrained amber countdown, never alarm. Action lives in a calm **olive green**
that is a **user-selectable accent** — each person can recolor the app (olive,
cobalt, seafoam, blush, tangerine, oxblood) while the source and status signals
stay fixed.

---

## Content fundamentals — voice & microcopy

- **Active voice, user-side names.** "Save", never "Submit". The action keeps
  the **same name across the whole flow** (Save → Save → Save).
- **Sentence case** everywhere. No Title Case buttons, no ALL-CAPS shouting
  (uppercase is reserved for *catalog metadata* set in Space Mono).
- **Direction, not mood.** Empty / error / processing states say *what to do
  next*. No mascots, no "Oops!", minimal exclamation, **no emoji**.
- **You, lightly.** Address the user as "you" only when needed ("Why are you
  saving this?"); most labels are bare nouns/verbs ("Note", "Regenerate").
- **No filler.** Counts and timestamps earn their place; nothing decorative.

Examples (see the *Voice & microcopy* card):

| Do | Don't |
|---|---|
| All sorted — nothing to review. | Your inbox is empty 🎉 |
| In 3 days this moves to Archive. | Hurry! Expiring soon!! |
| Couldn't reach that link. Try again. | Oops! Something went wrong. |
| Save | Submit / Confirm / Done |

---

## Visual foundations

**Color.** Six named hues — `ink`, `slate`, `paper`, `olive` (primary/action),
`amber` (aging), `mist` (borders) — expanded into full semantic token sets for
**light and dark**. The **primary** group is a *user-selectable accent*
(`tokens/accents.css`, default olive); set `data-accent` on the root to switch.
Two extra first-class systems: a **source palette**
(`--src-article|video|reel|document|note`) and a **status palette**
(`--status-processing|ready|saved|archived|expiring`). Amber appears **only** on
the expiring/aging signal — if you see warmth, something is decaying.

**Type.** A deliberate trio, all available to RN via `@expo-google-fonts`:
- **Bricolage Grotesque** — display, titles, bucket names, UI chrome. Quirky,
  editorial, confident.
- **Newsreader** — the *reading hero*: every summary, note and saved view. A
  low-contrast serif tuned for long reading on small screens (distinct from the
  banned high-contrast-serif look).
- **Space Mono** — *catalog metadata*: source labels, counts, countdowns, tags.
  Uppercase + tracked. This is what gives the app its "living library" feel.

**Spacing & radii.** 4pt base scale; 16px screen gutter; 44px minimum touch
target. Cards 16px radius, controls 12px, inputs 10px, tags/FAB pill. Friendly
but composed — never zero-radius.

**Elevation.** Soft, low, cool-tinted shadows (`--shadow-sm/md/lg`, plus an
accent-tinted `--shadow-fab`). Dark mode leans on surface lightness + borders
rather than heavy shadow. The only "glow" is a 1px amber ring on expiring cards.

**Surfaces & background.** Cool paper (`#F1F4F7`) in light, deep ink-navy
(`#0E141B`) in dark. Cards are flat white/raised-ink with a hairline border and
a soft shadow — no gradients, no textures, no full-bleed imagery. The app is
content-first; imagery is the user's saved items, represented by source stamps,
not stock photography.

**Motion.** Little and targeted. Processing pulses gently; the dictation mic
pulses while recording; skeletons shimmer. Everything honors
`prefers-reduced-motion`. No decorative looping, no parallax, no bounce.

**States.** Hover/press are subtle (soft background shift, slight opacity);
focus shows a 3px primary-soft ring for accessibility. Disabled drops to ~45%
opacity. Selected chips take the primary-soft fill.

---

## Iconography

- **Style:** a single coherent **Lucide-style line set** — 24×24, **1.8 stroke**,
  round caps/joins, `currentColor`. Lives in
  `components/core/icons.jsx` (source glyphs, navigation, status, actions).
- **Source glyphs** are part of the brand: article (lines), video (play in
  frame), reel (vertical play), document (folded page), note (bookmark). They
  appear inside source stamps tinted by the source hue.
- **No emoji, no unicode-as-icon** in product UI. (A couple of unicode marks
  appear only in the kit's *developer chrome* toggle, never in the app itself.)
- **Production substitution (flagged):** because the repo had no icon assets,
  the set was authored to **mirror `lucide-react-native` names** (InboxIcon →
  `Inbox`, SearchIcon → `Search`, etc.) so Claude Code can swap 1:1 with the
  real Lucide package on device. Replace the inline SVGs with
  `lucide-react-native` imports in production.
- **Logo:** `assets/logo-mark.svg` (a scoop catching a settling saved card) and
  `assets/logo-wordmark.svg`. Bucket uses `currentColor` (theme-adaptive); the
  captured fragment + spark are fixed olive (the default accent). Wordmark sets
  "Info" in olive and "Bucket" in ink/paper.

---

## Tokens for code (hand-off)

All tokens are CSS custom properties under `:root` (light) and `[data-theme="dark"]`
(dark), reachable from `styles.css`. For React Native, mirror them as a JS object
or NativeWind theme — names map directly:

```js
// design-tokens.ts (mirror of the CSS custom properties)
export const color = {
  light: { bg:'#F1F4F7', surface:'#FFFFFF', textPrimary:'#16202B', textSecondary:'#5B6878',
           primary:'#7CA84F', accent:'#C77D29', border:'#DCE3EA',
           success:'#2F8F5B', warning:'#C77D29', danger:'#C24338',
           src:{ article:'#3B6EA5', video:'#C8453C', reel:'#7C5CC4', document:'#3F8F6B', note:'#5B6878' },
           status:{ processing:'#7C8A99', ready:'#5E8E2E', saved:'#2F8F5B', archived:'#8995A3', expiring:'#C77D29' } },
  dark:  { bg:'#0E141B', surface:'#18212C', textPrimary:'#EAEEF2', textSecondary:'#9DAAB8',
           primary:'#9CC57E', accent:'#E0A24C', border:'#2A3540',
           success:'#4FB47C', warning:'#E0A24C', danger:'#E2675C',
           src:{ article:'#6FA3D6', video:'#E26A60', reel:'#A88BE0', document:'#5FB68A', note:'#9DAAB8' },
           status:{ processing:'#8B98A6', ready:'#8FBE6A', saved:'#4FB47C', archived:'#6C7A89', expiring:'#E0A24C' } },
};
// Selectable accents (override `primary` per user; status stays fixed).
export const accents = {
  olive:     { light:'#7CA84F', dark:'#9CC57E' },  // default
  cobalt:    { light:'#2D5AD9', dark:'#6E92F2' },
  seafoam:   { light:'#12A199', dark:'#52C6BE' },
  blush:     { light:'#DC6F94', dark:'#EF9CB7' },
  tangerine: { light:'#E5731F', dark:'#F19A4E' },
  oxblood:   { light:'#8E2E3C', dark:'#D06672' },
};
export const font = { display:'BricolageGrotesque', read:'Newsreader', mono:'SpaceMono' };
export const radius = { sm:10, md:12, lg:16, xl:22, pill:999 };
export const space = { 1:2, 2:4, 3:8, 4:12, 5:16, 6:20, 7:24, 8:32, 9:40, 10:48, 12:64 };
```

The authoritative source is the CSS in `tokens/`; keep this object in sync with it.

### Accent themes (per-user color)

The `--primary*` group is personalization, not a fixed brand color. `tokens/accents.css`
defines six accents (olive default, cobalt, seafoam, blush, tangerine, oxblood). Switch by
setting `data-accent` on the **same element** that carries `data-theme`:

```html
<html data-theme="dark" data-accent="cobalt"> … </html>
```

In React Native, mirror this as a theme context that swaps the `primary` token (use the
`accents` map above). **Status colors never change with the accent** — they are information.
The UI kit's Settings screen (and the prototype's top bar) demo the live picker.

---

## Index / manifest

**Foundations**
- `styles.css` — global entry (imports only)
- `tokens/` — `fonts.css`, `colors.css`, `accents.css`, `typography.css`, `spacing.css`, `radii.css`, `shadows.css`
- `guidelines/*.card.html` — specimen cards (Colors incl. accent themes, Type, Spacing, Brand)
- `assets/` — `logo-mark.svg`, `logo-wordmark.svg`

**Components** (`components/<group>/`, namespace `window.InfoBucketDesignSystem_7416d2`)
- `core/` — **Button**, **SourceStamp**, **StatusBadge**, **Tag**, **BucketChip**, `icons.jsx`
- `cards/` — **ItemCard** (processing / ready / expiring), **BucketCard**
- `forms/` — **TextField**, **NoteField** (dictation), **SearchField**
- `navigation/` — **TabBar**, **AddButton** (FAB)
- `feedback/` — **EmptyState**, **ErrorBanner**

**UI kit** (`ui_kits/infobucket-app/`)
- `index.html` — interactive prototype (light + dark toggle, share-sheet trigger)
- Screens: Inbox, Review/detail, Library, Bucket detail, Search, Capture/Share,
  Add (manual), Create/Edit bucket, Archive, Settings
- `data.js`, `shell.jsx`, `screens-main.jsx`, `screens-aux.jsx`

**Skill**
- `SKILL.md` — Agent Skills entry point for downloading + reuse in Claude Code
