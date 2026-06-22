---
name: infobucket-design
description: Use this skill to generate well-branded interfaces and assets for InfoBucket — a calm, mobile-first triage-and-retrieval app (React Native / Expo) — for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- **Position:** "Living Archive" — calm reading room, cool ink-slate neutrals on
  paper, calm olive green for action, amber reserved ONLY for aging/expiry.
- **Accent is user-selectable:** the `--primary*` group is a per-user accent
  (`tokens/accents.css`: olive default, cobalt, seafoam, blush, tangerine,
  oxblood) — set `data-accent` on the root. Status colors stay fixed.
- **Two structural signals are information, not decoration:** source (article ·
  video · reel · document · note) and status (processing · ready · saved ·
  archived · expiring).
- **Signature element:** provenance — every item leads with a tinted **source stamp**.
- **The summary is the hero** of every screen (set in Newsreader).

## Where things are

- `styles.css` + `tokens/` — design tokens (CSS custom properties), light + dark.
- `guidelines/*.card.html` — foundation specimens (colors, type, spacing, brand).
- `components/<group>/` — React components (Button, SourceStamp, StatusBadge, Tag,
  BucketChip, ItemCard, BucketCard, TextField, NoteField, SearchField, TabBar,
  AddButton, EmptyState, ErrorBanner). Each has a `.d.ts` + `.prompt.md`.
- `ui_kits/infobucket-app/` — interactive light/dark app prototype + all screens.
- `assets/` — logo mark + wordmark.

## Type & icons

- Fonts: **Bricolage Grotesque** (display/UI), **Newsreader** (reading/summary),
  **Space Mono** (catalog metadata). On device, load via `@expo-google-fonts`.
- Icons: Lucide-style line set in `components/core/icons.jsx`, named to match
  **`lucide-react-native`** — swap 1:1 in production. No emoji in product UI.

## Voice

Active voice, user-side names ("Save", not "Submit"), sentence case, no emoji,
no filler. Empty/error/processing states give direction (what to do), not mood.
