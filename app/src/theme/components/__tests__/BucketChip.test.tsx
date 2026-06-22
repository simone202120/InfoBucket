import { createElement, type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { BucketChip } from '../BucketChip';

function renderInTheme(node: ReactNode) {
  return render(createElement(ThemeProvider, null, node));
}

describe('BucketChip', () => {
  it('mostra il nome del bucket', () => {
    const { getByText } = renderInTheme(<BucketChip name="Machine learning" />);
    expect(getByText('Machine learning')).toBeTruthy();
  });

  it('chiama onAccept dal controllo "accetta"', () => {
    const onAccept = jest.fn();
    const { getByLabelText } = renderInTheme(<BucketChip name="Machine learning" onAccept={onAccept} />);
    fireEvent.press(getByLabelText('Accept Machine learning'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('per un bucket nuovo prefigge "New ·" e offre "Create"', () => {
    const onAccept = jest.fn();
    const { getByText, getByLabelText } = renderInTheme(
      <BucketChip name="Robotics" isNew onAccept={onAccept} />,
    );
    expect(getByText('New · Robotics')).toBeTruthy();
    fireEvent.press(getByLabelText('Create Robotics'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
