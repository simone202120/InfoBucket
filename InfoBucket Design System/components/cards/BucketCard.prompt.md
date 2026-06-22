A Library collection card — name (Bricolage), item count, description, and a small spine of source-hued ticks. Use in the Library grid/list.

```jsx
<BucketCard
  name="Machine learning"
  count={24}
  description="Papers and explainers I want to actually finish."
  sources={['article','document','video']}
  onClick={open}
/>
```

The `description` doubles as the routing hint the AI reads when proposing this bucket, so keep it specific.
