Multi-line note field rendered in Newsreader with a built-in dictation mic (the brief's "nota anche dettata"). Use in Review and Capture.

```jsx
<NoteField value={note} onChange={setNote} recording={rec} onDictate={toggleRec} />
```

`recording` pulses the mic to show active dictation.
