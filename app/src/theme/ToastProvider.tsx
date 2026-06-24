/**
 * Provider del toast: una sola fonte per il feedback effimero. `useToast` espone
 * `showToast`; il toast si nasconde da solo dopo qualche secondo. Va montato
 * sotto <ThemeProvider> e sopra le schermate.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from './components/Toast';
import { useReducedMotion } from './motion';

const VISIBLE_MS = 2600;
/** Durata della comparsa/sparizione del toast (ms). */
const ANIM_MS = 220;
/** Slide verticale d'ingresso del toast (px, dal basso). */
const SLIDE_DISTANCE = 12;

interface ToastApi {
  showToast: (opts: { message: string }) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [message, setMessage] = useState<string | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sparizione: con "riduci movimento" è immediata; altrimenti svanisce e poi smonta.
  const hide = useCallback(() => {
    if (reduced) {
      setMessage(null);
      return;
    }
    Animated.timing(anim, { toValue: 0, duration: ANIM_MS, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setMessage(null);
    });
  }, [anim, reduced]);

  const showToast = useCallback<ToastApi['showToast']>(
    ({ message: m }) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(m);
      anim.setValue(reduced ? 1 : 0);
      if (!reduced) {
        Animated.timing(anim, { toValue: 1, duration: ANIM_MS, useNativeDriver: true }).start();
      }
      timer.current = setTimeout(hide, VISIBLE_MS);
    },
    [anim, reduced, hide],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message !== null ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.host,
            {
              bottom: insets.bottom + 24,
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [SLIDE_DISTANCE, 0] }) }],
            },
          ]}
        >
          <Toast message={message} />
        </Animated.View>
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
