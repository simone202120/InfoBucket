import * as Haptics from 'expo-haptics';
import { haptics } from '../haptics';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light' },
}));

it('success invoca notificationAsync', () => {
  haptics.success();
  expect((Haptics.notificationAsync as jest.Mock)).toHaveBeenCalled();
});

it('non lancia se l\'API fallisce', () => {
  (Haptics.impactAsync as jest.Mock).mockImplementationOnce(() => { throw new Error('no haptics'); });
  expect(() => haptics.light()).not.toThrow();
});
