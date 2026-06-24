/**
 * ListSkeleton — placeholder a card per il primo caricamento di una lista, al
 * posto di uno spinner nudo. Le righe pulsano con uno shimmer sobrio; con
 * "riduci movimento" restano statiche. Stile dal tema.
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useReducedMotion, useTheme } from '@/theme';

const ROWS = ['100%', '92%', '64%'] as const;
/** Estremi dell'opacità durante lo shimmer. */
const SHIMMER_MIN = 0.5;
const SHIMMER_MAX = 1;
/** Durata di mezza pulsazione dello shimmer (ms). */
const SHIMMER_MS = 750;

export interface ListSkeletonProps {
  count?: number;
}

export function ListSkeleton({ count = 4 }: ListSkeletonProps): JSX.Element {
  const t = useTheme();
  const reduced = useReducedMotion();
  const shimmer = useRef(new Animated.Value(SHIMMER_MAX)).current;

  useEffect(() => {
    if (reduced) {
      shimmer.setValue(SHIMMER_MAX);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: SHIMMER_MIN, duration: SHIMMER_MS, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: SHIMMER_MAX, duration: SHIMMER_MS, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer, reduced]);

  return (
    <View style={{ gap: t.space[4] }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          accessibilityLabel="Caricamento"
          style={[
            {
              backgroundColor: t.colors.surface,
              borderRadius: t.radius.lg,
              borderWidth: 1,
              borderColor: t.colors.border,
              padding: t.gutter,
              gap: t.space[3],
            },
            t.shadow.sm,
          ]}
        >
          {ROWS.map((w, j) => (
            <Animated.View
              key={j}
              style={[styles.line, { width: w, backgroundColor: t.colors.bgSunken, opacity: shimmer }]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ line: { height: 12, borderRadius: 6 } });
