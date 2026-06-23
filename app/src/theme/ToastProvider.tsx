/**
 * Provider del toast: una sola fonte per il feedback effimero. `useToast` espone
 * `showToast`; il toast si nasconde da solo dopo qualche secondo. Va montato
 * sotto <ThemeProvider> e sopra le schermate.
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from './components/Toast';

const VISIBLE_MS = 2600;

interface ToastApi {
  showToast: (opts: { message: string }) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback<ToastApi['showToast']>(({ message: m }) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(m);
    timer.current = setTimeout(() => setMessage(null), VISIBLE_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message !== null ? (
        <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 24 }]}>
          <Toast message={message} />
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve essere usato dentro <ToastProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
});
