/**
 * Wrapper aptico: un solo punto che conosce expo-haptics. Le chiamate sono
 * "fire and forget" e non lanciano mai (un telefono senza motore aptico, o un
 * errore dell'API, non deve mai rompere il flusso).
 */
import * as Haptics from 'expo-haptics';

export const haptics = {
  success(): void {
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      /* aptico non disponibile: ignora */
    }
  },
  light(): void {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* aptico non disponibile: ignora */
    }
  },
};
