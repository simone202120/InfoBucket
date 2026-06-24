import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadThemePrefs, saveThemePrefs } from '../themeStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
const get = AsyncStorage.getItem as jest.Mock;
const set = AsyncStorage.setItem as jest.Mock;

beforeEach(() => { get.mockReset(); set.mockReset(); });

it('ritorna default quando non c\'è nulla salvato', async () => {
  get.mockResolvedValue(null);
  await expect(loadThemePrefs()).resolves.toEqual({ accent: 'olive', customColor: null, mode: null });
});

it('salva e rilegge le preferenze', async () => {
  set.mockResolvedValue(undefined);
  await saveThemePrefs({ accent: 'custom', customColor: '#2D5AD9', mode: 'dark' });
  expect(set).toHaveBeenCalledWith('infobucket.theme', JSON.stringify({ accent: 'custom', customColor: '#2D5AD9', mode: 'dark' }));
});

it('ignora JSON corrotto e torna ai default', async () => {
  get.mockResolvedValue('{non-json');
  await expect(loadThemePrefs()).resolves.toEqual({ accent: 'olive', customColor: null, mode: null });
});
