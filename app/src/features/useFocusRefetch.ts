/**
 * Ricarica i dati quando la schermata torna in focus. Con expo-router le
 * schermate restano montate durante la navigazione: senza questo, tornando
 * indietro si vedrebbero dati vecchi finché non si fa pull-to-refresh.
 */
import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

export function useFocusRefetch(refetch: () => void | Promise<void>): void {
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );
}
