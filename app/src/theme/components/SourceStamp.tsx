/**
 * SourceStamp — il marchio di provenienza. Un quadrato tinto nella tinta della
 * fonte che contiene il suo glifo; ogni elemento catturato apre con uno.
 * Opzionalmente mostra il nome della fonte (e testo libero) in mono catalogo.
 * Colore e glifo arrivano dal tema (`theme.sourceColor` + `SOURCE_ICON`).
 */
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, type Theme } from '@/theme';
import { SOURCE_ICON } from '@/theme/icons';
import type { SourceType } from '@/types/domain';

export type SourceStampSize = 'sm' | 'md' | 'lg';

export interface SourceStampProps {
  source: SourceType;
  /** @default "md" */
  size?: SourceStampSize;
  /** Mostra l'etichetta testuale accanto al quadrato. */
  showLabel?: boolean;
  /** Testo libero che sovrascrive l'etichetta di default (es. la testata). */
  label?: string;
  style?: StyleProp<ViewStyle>;
}

const SOURCE_LABEL: Record<SourceType, string> = {
  article: 'Article',
  youtube: 'Video',
  reel: 'Reel',
  tiktok: 'Reel',
  document: 'Document',
  other: 'Note',
};

interface BoxSpec {
  box: number;
  icon: number;
  radius: number;
}

function boxSpec(theme: Theme, size: SourceStampSize): BoxSpec {
  switch (size) {
    case 'sm':
      return { box: 28, icon: 15, radius: theme.radius.sm };
    case 'lg':
      return { box: 48, icon: 25, radius: theme.radius.md };
    case 'md':
    default:
      return { box: 38, icon: 20, radius: theme.radius.md };
  }
}

export function SourceStamp({ source, size = 'md', showLabel = false, label, style }: SourceStampProps): JSX.Element {
  const theme = useTheme();
  const s = boxSpec(theme, size);
  const { fg, soft } = theme.sourceColor(source);
  const Icon = SOURCE_ICON[source];

  const stamp = (
    <View
      style={[
        styles.box,
        { width: s.box, height: s.box, borderRadius: s.radius, backgroundColor: soft },
        !showLabel ? style : undefined,
      ]}
    >
      <Icon size={s.icon} color={fg} />
    </View>
  );

  if (!showLabel) return stamp;

  return (
    <View style={[styles.row, style]}>
      {stamp}
      <Text
        style={{
          fontFamily: theme.font.mono,
          fontSize: theme.type.meta.size,
          letterSpacing: theme.type.meta.size * theme.type.meta.tracking,
          textTransform: 'uppercase',
          color: theme.colors.textSecondary,
        }}
      >
        {label ?? SOURCE_LABEL[source]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
