/**
 * Esegue `callback` a intervalli regolari finché `active` è true. Usato per
 * aggiornare le liste mentre ci sono item in lavorazione (processing→ready),
 * senza websocket. Si autospegne quando `active` diventa false o allo smontaggio.
 */
import { useEffect, useRef } from 'react';

export interface PollingOptions {
  active: boolean;
  intervalMs?: number;
}

export function usePolling(callback: () => void, { active, intervalMs = 5000 }: PollingOptions): void {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => saved.current(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
}
