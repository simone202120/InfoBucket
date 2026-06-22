Single-line labelled input with focus ring, hint and error states. Use for bucket names, manual URLs, account fields.

```jsx
<TextField label="Bucket name" value={name} onChange={setName} placeholder="e.g. Machine learning" />
<TextField label="URL" iconLeft={<LinkIcon/>} value={url} onChange={setUrl} error="Couldn't reach that link." />
```
