/**
 * Primitive di animazione del design system — un tocco di "vita" sobrio e coerente.
 *
 * Usano solo l'API `Animated` nativa di React Native (niente dipendenze extra).
 * Sono pensate per essere applicate con parsimonia (il brief: "motion poca e
 * mirata"): comparse morbide delle liste e feedback tattile al tocco.
 *
 * Rispettano SEMPRE "riduci movimento" (accessibilità, brief §Vincoli): con la
 * preferenza attiva, gli elementi appaiono già nello stato finale, senza animare.
 */
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/** Durate di motion condivise (ms). Brevi: il movimento accompagna, non intrattiene. */
export const MOTION = {
  /** Comparsa di un elemento (fade + slide). */
  enter: 320,
  /** Feedback al tocco (scala). */
  press: 120,
  /** Passo di sfalsamento tra elementi consecutivi di una lista. */
  stagger: 45,
  /** Sfalsamento massimo: oltre, gli elementi compaiono insieme (liste lunghe). */
  staggerMax: 6,
} as const;

/** True se l'utente ha attivato "riduci movimento". Reattivo ai cambi di sistema. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (active) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

export interface FadeInUpProps {
  children: ReactNode;
  /** Ritardo di partenza in ms (per lo sfalsamento di lista). */
  delay?: number;
  /** Distanza dello slide verso l'alto, in px. */
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fa comparire i figli con un fade + leggero slide verso l'alto.
 * `index`/`delay` permettono lo sfalsamento delle liste senza orchestrazione esterna.
 */
export function FadeInUp({ children, delay = 0, distance = 10, style }: FadeInUpProps): JSX.Element {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: MOTION.enter,
      delay,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, delay, reduced]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Calcola il ritardo di comparsa per l'elemento `index` di una lista: sfalsamento
 * dolce che si azzera oltre `MOTION.staggerMax` (liste lunghe → comparsa unica,
 * niente attese fastidiose).
 */
export function staggerDelay(index: number): number {
  return index < MOTION.staggerMax ? index * MOTION.stagger : 0;
}

export interface PressableScaleProps extends PressableProps {
  children: ReactNode;
  /** Scala raggiunta alla pressione (1 = nessun effetto). */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * `Pressable` che si rimpicciolisce leggermente alla pressione: feedback tattile
 * discreto su card e bottoni. Degrada a una semplice pressione se "riduci movimento".
 */
export function PressableScale({
  children,
  scaleTo = 0.97,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps): JSX.Element {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number): void => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  return (
    <Pressable
      onPressIn={(e) => {
        if (!reduced) animateTo(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduced) animateTo(1);
        onPressOut?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}
