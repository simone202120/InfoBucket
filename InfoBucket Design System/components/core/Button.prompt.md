Action control whose label is the same user-side verb used across the whole flow (Save, Regenerate, Delete) — use for any tap target that performs an action.

```jsx
<Button variant="primary" size="lg" fullWidth onClick={save}>Save</Button>
<Button variant="secondary">Pick another bucket</Button>
<Button variant="ghost" size="sm">Skip</Button>
<Button variant="destructive" iconLeft={<TrashIcon/>}>Delete</Button>
```

Variants: `primary` (filled olive — follows the user's accent), `secondary` (bordered surface), `ghost` (text only), `destructive` (soft red). Sizes `sm | md | lg`; `md`/`lg` meet the 44pt touch minimum. Set `fullWidth` for bottom-sheet CTAs.
