The lifecycle signal — a mono pill with a state dot showing where an item is in its life.

```jsx
<StatusBadge status="processing" />
<StatusBadge status="ready" />
<StatusBadge status="expiring">In 3 days</StatusBadge>
```

`status`: `processing | ready | saved | archived | expiring`. `processing` pulses (respects reduced-motion). Pass `children` to replace the label — used for expiry countdowns. Colors come from `--status-*` tokens.
