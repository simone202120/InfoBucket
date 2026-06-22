The provenance signature — a tinted square in the source's hue with its glyph. Lead every item card, search result and saved entry with one.

```jsx
<SourceStamp source="video" size="md" />
<SourceStamp source="article" showLabel label="The Atlantic" />
```

`source`: `article | video | reel | document | note`. `size`: `sm | md | lg`. `showLabel` adds the mono catalog label (override with `label` for a publication/handle). Color comes entirely from the `--src-*` tokens — never recolor it.
