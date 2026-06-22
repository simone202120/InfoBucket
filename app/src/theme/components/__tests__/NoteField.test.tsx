import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { NoteField } from '../NoteField';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

describe('NoteField', () => {
  it('propaga il testo digitato', () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = renderInTheme(
      <NoteField label="Note" value="" onChangeText={onChangeText} />,
    );
    fireEvent.changeText(getByLabelText('Note'), 'una nota');
    expect(onChangeText).toHaveBeenCalledWith('una nota');
  });

  it('offre la dettatura e chiama onDictate', () => {
    const onDictate = jest.fn();
    const { getByLabelText } = renderInTheme(<NoteField onDictate={onDictate} />);
    fireEvent.press(getByLabelText('Dictate note'));
    expect(onDictate).toHaveBeenCalledTimes(1);
  });

  it('mostra lo stato di registrazione', () => {
    const { getByLabelText } = renderInTheme(<NoteField recording onDictate={jest.fn()} />);
    expect(getByLabelText('Stop dictation')).toBeTruthy();
  });
});
