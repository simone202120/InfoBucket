import * as React from 'react';

export interface NoteFieldProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Active dictation state (mic pulses). */
  recording?: boolean;
  onDictate?: () => void;
  rows?: number;
  style?: React.CSSProperties;
}

/** Multi-line note input in Newsreader with a dictation mic. */
export function NoteField(props: NoteFieldProps): JSX.Element;
