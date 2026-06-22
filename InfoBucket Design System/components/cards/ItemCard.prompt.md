The Inbox hero card — provenance stamp, lifecycle status, and a Newsreader summary as the most readable element. Use for any captured item in a queue or list.

```jsx
<ItemCard
  source="article" sourceName="The Atlantic"
  title="How transformers actually learn"
  summary="The single claim worth keeping, surfaced first…"
  status="ready"
  proposedBucket={{ name: 'Machine learning' }}
  tags={['ml','to-read']}
  onAccept={accept}
/>
<ItemCard source="video" status="processing" />
<ItemCard source="reel" status="expiring" daysLeft={3} summary="…" />
```

`status`: `processing` shows a shimmer skeleton; `ready` shows the bucket proposal + tags; `expiring` adds the amber "In N days → Archive" countdown (pass `daysLeft`).
