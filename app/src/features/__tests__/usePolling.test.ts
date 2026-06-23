import { renderHook } from '@testing-library/react-native';
import { usePolling } from '../usePolling';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('chiama la callback a ogni intervallo quando attivo', () => {
  const cb = jest.fn();
  renderHook(() => usePolling(cb, { active: true, intervalMs: 1000 }));
  expect(cb).not.toHaveBeenCalled();
  jest.advanceTimersByTime(3000);
  expect(cb).toHaveBeenCalledTimes(3);
});

it('non chiama la callback quando inattivo', () => {
  const cb = jest.fn();
  renderHook(() => usePolling(cb, { active: false, intervalMs: 1000 }));
  jest.advanceTimersByTime(3000);
  expect(cb).not.toHaveBeenCalled();
});

it('ferma il polling allo smontaggio', () => {
  const cb = jest.fn();
  const { unmount } = renderHook(() => usePolling(cb, { active: true, intervalMs: 1000 }));
  jest.advanceTimersByTime(1000);
  expect(cb).toHaveBeenCalledTimes(1);
  unmount();
  jest.advanceTimersByTime(3000);
  expect(cb).toHaveBeenCalledTimes(1);
});
