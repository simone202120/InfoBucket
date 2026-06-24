/**
 * ListSkeleton — placeholder a card per il primo caricamento di una lista, al
 * posto di uno spinner nudo. Stile dal tema; statico (lo shimmer animato arriva
 * nel Piano 3, dopo l'estensione del motion).
 */
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';

const ROWS = ['100%', '92%', '64%'] as const;

export interface ListSkeletonProps {
  count?: number;
}

export function ListSkeleton({ count = 4 }: ListSkeletonProps): JSX.Element {
  const t = useTheme();
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
            <View key={j} style={[styles.line, { width: w, backgroundColor: t.colors.bgSunken }]} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ line: { height: 12, borderRadius: 6 } });
