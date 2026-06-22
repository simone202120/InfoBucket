import * as React from 'react';

export interface TextFieldProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  type?: string;
  iconLeft?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Labelled single-line input with focus ring and error/hint text.
 *
 * @startingPoint section="Forms" subtitle="TextField, NoteField (dictation), SearchField" viewport="700x320"
 */
export function TextField(props: TextFieldProps): JSX.Element;
