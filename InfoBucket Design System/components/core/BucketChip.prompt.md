The core triage gesture: an AI-proposed bucket you can accept in one tap. A sparkle marks the suggestion; the trailing control accepts (✓) or creates (+) a new bucket.

```jsx
<BucketChip name="Machine learning" onAccept={accept} />
<BucketChip name="Climate" isNew onAccept={createAndSave} />
<BucketChip name="Machine learning" confirmed />
```

`isNew` turns the proposal into "New · Name" with a + control. `confirmed` is the settled post-accept state (primary fill, no sparkle).
