/**
 * ItemCard — l'eroe dell'Inbox. Apre con lo stamp di provenienza e lo stato del
 * ciclo di vita, e rende il summary (Newsreader) la cosa più leggibile a
 * schermo. Gestisce tre stati live: processing (skeleton), ready (con proposta
 * bucket accettabile al volo) ed expiring (countdown ambra sobrio).
 * Compone SourceStamp · StatusBadge · BucketChip · Tag.
 */
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MOTION, PressableScale, useReducedMotion, useTheme, type Theme } from '@/theme';
import { ArchiveIcon, ChevronRightIcon } from '@/theme/icons';
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
  /** Azione swipe a sinistra: archivia l'elemento. Se assente, niente swipe archivio. */
  onArchive?: () => void;
  /** Azione swipe a destra: apre la revisione. Se assente, niente swipe rivedi. */
  onReview?: () => void;
  style?: StyleProp<ViewStyle>;
}

const SOURCE_LABEL: Record<SourceType, string> = {
  article: 'Articolo',
  youtube: 'Video',
  reel: 'Reel',
  tiktok: 'Reel',
  document: 'Documento',
  other: 'Nota',
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
  onArchive,
  onReview,
  style,
}: ItemCardProps): JSX.Element {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const swipeRef = useRef<Swipeable>(null);
  const hasSwipe = Boolean(onArchive || onReview);

  // "Draw-in" della rail: si disegna dall'alto alla comparsa, in sincrono col
  // FadeInUp della lista. Con "riduci movimento" è già piena.
  const railDraw = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      railDraw.setValue(1);
      return;
    }
    const anim = Animated.timing(railDraw, { toValue: 1, duration: MOTION.enter, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [railDraw, reduced]);
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
      // Spazio extra a sinistra per la barra di provenienza (rail), che è absolute.
      paddingLeft: theme.gutter + theme.space[2],
    },
    theme.shadow.sm,
    style,
  ];

  const content = (
    <>
      {/* Barra di provenienza: l'elemento firma, nel colore della fonte. */}
      <Animated.View
        testID="provenance-rail"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          backgroundColor: theme.sourceColor(source).fg,
          transformOrigin: 'top',
          transform: [{ scaleY: railDraw }],
        }}
      />

      {/* Header: provenienza + stato */}
      <View style={styles.header}>
        <SourceStamp source={source} size="md" host={sourceName ?? null} />
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
          {expiring && hasDaysLeft ? `Tra ${daysLeft} giorni` : undefined}
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
        <Text style={metaTextStyle(theme, theme.colors.textTertiary)}>Riassumo · propongo un bucket…</Text>
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

    </>
  );

  const card = onPress ? (
    <PressableScale accessibilityRole="button" onPress={onPress} style={cardStyle}>
      {content}
    </PressableScale>
  ) : (
    <View style={cardStyle}>{content}</View>
  );

  if (!hasSwipe) return card;

  // Lo swipe è una scorciatoia: le stesse azioni restano raggiungibili altrove
  // (tap sulla card per rivedere, Archivio dall'header). I bottoni-azione sono
  // accessibili e ≥44pt; al tap chiudono la riga.
  const close = () => swipeRef.current?.close();
  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={
        onArchive
          ? () => (
              <SwipeAction
                label="Archivia"
                icon={<ArchiveIcon size={20} color={theme.colors.status.archived} />}
                background={theme.colors.status.archivedSoft}
                align="flex-start"
                onPress={() => {
                  close();
                  onArchive();
                }}
              />
            )
          : undefined
      }
      renderRightActions={
        onReview
          ? () => (
              <SwipeAction
                label="Rivedi"
                icon={<ChevronRightIcon size={20} color={theme.colors.primary} />}
                background={theme.colors.primarySoft}
                align="flex-end"
                onPress={() => {
                  close();
                  onReview();
                }}
              />
            )
          : undefined
      }
    >
      {card}
    </Swipeable>
  );
}

/** Bottone-azione rivelato dallo swipe della card. Accessibile, ≥44pt. */
function SwipeAction({
  label,
  icon,
  background,
  align,
  onPress,
}: {
  label: string;
  icon: JSX.Element;
  background: string;
  align: 'flex-start' | 'flex-end';
  onPress: () => void;
}): JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 96,
        backgroundColor: background,
        borderRadius: theme.radius.lg,
        marginVertical: 0,
        paddingHorizontal: theme.gutter,
        alignItems: align,
        justifyContent: 'center',
        gap: theme.space[1],
      }}
    >
      {icon}
      <Text style={metaTextStyle(theme, theme.colors.textSecondary)}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  headerMeta: { flex: 1, minWidth: 0 },
  skeleton: { gap: 8, marginTop: 4, marginBottom: 14 },
  skeletonLine: { height: 12, borderRadius: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
});
