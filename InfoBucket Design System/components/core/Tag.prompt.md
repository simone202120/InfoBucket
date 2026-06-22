Keyword chip set in catalog mono with a leading `#`. Quiet by default.

```jsx
<Tag>machine-learning</Tag>
<Tag selected onClick={toggle}>to-read</Tag>
<Tag removable onRemove={drop}>draft</Tag>
```

`selected` tints it with the primary soft fill (use for active search filters); `removable` adds an × for the review tag editor.
