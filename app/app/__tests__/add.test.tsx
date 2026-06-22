import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactElement } from 'react';
import AddScreen from '../add';
import { addItemByUrl } from '@/lib/items';
import { ThemeProvider } from '@/theme';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: jest.fn() }) }));
jest.mock('@/lib/items', () => ({
  addItemByUrl: jest.fn(),
  ItemsError: class ItemsError extends Error {},
}));

const addMock = addItemByUrl as jest.Mock;

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const wrap = (ui: ReactElement) =>
  render(<SafeAreaProvider initialMetrics={metrics}>{<ThemeProvider>{ui}</ThemeProvider>}</SafeAreaProvider>);

beforeEach(() => {
  mockBack.mockReset();
  addMock.mockReset();
});

it('salva un URL e chiude la schermata', async () => {
  addMock.mockResolvedValue({ id: 'x' });
  const { getByText, getByPlaceholderText } = wrap(<AddScreen />);

  fireEvent.changeText(getByPlaceholderText('https://…'), 'https://example.com');
  fireEvent.press(getByText('Salva'));

  await waitFor(() => expect(addMock).toHaveBeenCalledWith({ url: 'https://example.com', note: '' }));
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
});

it('non salva con URL vuoto (azione disabilitata)', () => {
  const { getByText } = wrap(<AddScreen />);
  fireEvent.press(getByText('Salva'));
  expect(addMock).not.toHaveBeenCalled();
});
