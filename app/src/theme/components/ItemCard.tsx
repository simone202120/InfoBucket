/**
 * ItemCard — l'eroe dell'Inbox. Apre con lo stamp di provenienza e lo stato del
 * ciclo di vita, e rende il summary (Newsreader) la cosa più leggibile a
 * schermo. Gestisce tre stati live: processing (skeleton), ready (con proposta
 * bucket accettabile al volo) ed expiring (countdown ambra sobrio).
 * Compone SourceStamp · StatusBadge · BucketChip · Tag.
 */
import { StyleSheet, Text, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, type Theme } from '@/theme';
import { ClockIcon } from '@/theme/icons';
import type { SourceType } from '@/types/domain';
import { BucketChip } from './BucketChip';
import { SourceStamp } from './SourceStamp';
import { StatusBadge, type BadgeStatus } from './StatusBadge';
import { Tag } from './Tag';

export interface ProposedBucket {
  name: string;
  isNew?: boolean;
}

export interface ItemCardProps {
  source: SourceType;
  /** Nome della fonte/testata (es. "The Atlantic"). */
  sourceName?: string;
  title?: string;
  summary?: string;
  tags?: readonly string[];
  /** @default "ready" */
  status?: BadgeStatus;
  proposedBucket?: ProposedBucket;
  /** Giorni rimasti prima dell'archiviazione (stato expiring). */
  daysLeft?: number;
  onAccept?: () => void;
  onPress?: () => void;
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

/** Larghezze (in %) delle righe dello skeleton di caricamento. */
const SKELETON_WIDTHS = ['100%', '92%', '64%'] as const;

function metaTextStyle(theme: Theme, color: string) {
  return {
    fontFamily: theme.font.mono,
    fontSize: theme.type.micro.size,
    letterSpacing: theme.type.micro.size * theme.type.micro.tracking,
    textTransform: 'uppercase' as const,
    color,
  };
}

export function ItemCard({
  source,
  sourceName,
  title,
  summary,
  tags = [],
  status = 'ready',
  proposedBucket,
  daysLeft,
  onAccept,
  onPress,
  style,
}: ItemCardProps): JSX.Element {
  const theme = useTheme();
  const processing = status === 'processing';
  const expiring = status === 'expiring';
  const hasDaysLeft = typeof daysLeft === 'number';

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderColor: expiring ? theme.colors.status.expiringSoft : theme.colors.border,
      padding: theme.gutter,
    },
    theme.shadow.sm,
    style,
  ];

  const content = (
    <>
      {/* Header: provenienza + stato */}
      <View style={styles.header}>
        <SourceStamp source={source} size="md" />
        <View style={styles.headerMeta}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: theme.font.mono,
              fontSize: theme.type.meta.size,
              letterSpacing: theme.type.meta.size * theme.type.meta.tracking,
              textTransform: 'uppercase',
              color: theme.colors.textSecondary,
            }}
          >
            {SOURCE_LABEL[source]}
            {sourceName ? ` · ${sourceName}` : ''}
          </Text>
        </View>
        <StatusBadge status={status}>
          {expiring && hasDaysLeft ? `In ${daysLeft} days` : undefined}
        </StatusBadge>
      </View>

      {/* Titolo */}
      {title && !processing ? (
        <Text
          style={{
            marginBottom: 6,
            fontFamily: theme.font.displayBold,
            fontSize: theme.type.heading.size,
            lineHeight: theme.type.heading.lh,
            color: theme.colors.textPrimary,
          }}
        >
          {title}
        </Text>
      ) : null}

      {/* Summary — l'eroe (o skeleton durante il processing) */}
      {processing ? (
        <View style={styles.skeleton} accessibilityLabel="Loading">
          {SKELETON_WIDTHS.map((w, i) => (
            <View key={i} style={[styles.skeletonLine, { width: w, backgroundColor: theme.colors.bgSunken }]} />
          ))}
        </View>
      ) : (
        <Text
          numberOfLines={3}
          style={{
            marginBottom: 14,
            fontFamily: theme.font.read,
            fontSize: theme.type.read.size,
            lineHeight: theme.type.read.lh,
            color: theme.colors.textPrimary,
          }}
        >
          {summary}
        </Text>
      )}

      {/* Footer: proposta bucket + tag, oppure nota di processing */}
      {processing ? (
        <Text style={metaTextStyle(theme, theme.colors.textTertiary)}>Summarising · proposing a bucket…</Text>
      ) : (
        <View style={styles.footer}>
          {proposedBucket ? (
            <BucketChip name={proposedBucket.name} isNew={proposedBucket.isNew} onAccept={onAccept} />
          ) : null}
          {tags.slice(0, 2).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </View>
      )}

      {/* Riga sobria di decadimento */}
      {expiring && !processing && hasDaysLeft ? (
        <View style={styles.decay}>
          <ClockIcon size={12} color={theme.colors.accent} />
          <Text style={metaTextStyle(theme, theme.colors.accent)}>In {daysLeft} days → Archive</Text>
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={cardStyle}>
        {content}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  headerMeta: { flex: 1, minWidth: 0 },
  skeleton: { gap: 8, marginTop: 4, marginBottom: 14 },
  skeletonLine: { height: 12, borderRadius: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  decay: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
});
