/**
 * BucketCard — la card della Libreria. Apre con il nome del bucket (font display),
 * il conteggio degli elementi, una descrizione breve (1-2 righe, troncata) e una
 * "spina" di trattini colorati, uno per ogni fonte presente (colore di
 * provenienza dal tema). Toccabile: porta al dettaglio del bucket.
 * Tutto lo stile arriva da `useTheme()`.
 */
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressableScale, useTheme } from '@/theme';
import type { SourceType } from '@/types/domain';

export interface BucketCardProps {
  name: string;
  /** Quanti elementi sono salvati nel bucket. */
  count: number;
  /** Hint di routing dell'AI: cosa va in questo bucket. */
  description?: string | null;
  /** Tipi di fonte presenti, per la spina colorata. */
  sources?: readonly SourceType[];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Etichetta del conteggio: "1 elemento" / "N elementi" / "Vuoto". */
function countLabel(count: number): string {
  if (count <= 0) return 'Vuoto';
  return count === 1 ? '1 elemento' : `${count} elementi`;
}

export function BucketCard({
  name,
  count,
  description,
  sources = [],
  onPress,
  style,
}: BucketCardProps): JSX.Element {
  const theme = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderColor: theme.colors.border,
      padding: theme.gutter,
    },
    theme.shadow.sm,
    style,
  ];

  const content = (
    <>
      {/* Spina di provenienza: un trattino per fonte presente */}
      {sources.length > 0 ? (
        <View style={styles.spine} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {sources.map((source) => (
            <View
              key={source}
              style={[styles.tick, { backgroundColor: theme.sourceColor(source).fg }]}
            />
          ))}
        </View>
      ) : null}

      <Text
        numberOfLines={2}
        style={{
          fontFamily: theme.font.displayBold,
          fontSize: theme.type.heading.size,
          lineHeight: theme.type.heading.lh,
          color: theme.colors.textPrimary,
        }}
      >
        {name}
      </Text>

      <Text
        style={{
          marginTop: 4,
          fontFamily: theme.font.mono,
          fontSize: theme.type.meta.size,
          letterSpacing: theme.type.meta.size * theme.type.meta.tracking,
          textTransform: 'uppercase',
          color: theme.colors.textSecondary,
        }}
      >
        {countLabel(count)}
      </Text>

      {description ? (
        <Text
          numberOfLines={2}
          style={{
            marginTop: 10,
            fontFamily: theme.font.read,
            fontSize: theme.type.readSm.size,
            lineHeight: theme.type.readSm.lh,
            color: theme.colors.textSecondary,
          }}
        >
          {description}
        </Text>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <PressableScale accessibilityRole="button" accessibilityLabel={name} onPress={onPress} style={cardStyle}>
        {content}
      </PressableScale>
    );
  }
  return <View style={cardStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  spine: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  tick: { width: 18, height: 4, borderRadius: 2 },
});
