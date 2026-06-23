import { renderHook } from '@testing-library/react-native';
import { useFocusRefetch } from '../useFocusRefetch';

// useFocusEffect di expo-router: in test eseguiamo subito la callback ricevuta.
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void | (() => void)) => cb(),
}));

it('chiama refetch al focus della schermata', () => {
  const refetch = jest.fn();
  renderHook(() => useFocusRefetch(refetch));
  expect(refetch).toHaveBeenCalledTimes(1);
});
