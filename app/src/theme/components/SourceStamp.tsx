/**
 * SourceStamp — il marchio di provenienza. Un quadrato tinto nella tinta della
 * fonte che contiene la sua rappresentazione; ogni elemento catturato apre con
 * uno. Scegliamo la rappresentazione più riconoscibile per la fonte: logo brand
 * reale (YouTube/Instagram/TikTok), favicon del dominio (articoli) o glifo
 * duotone (documento/nota, e fallback articolo). Opzionalmente mostra il nome
 * della fonte in mono catalogo. Colore e tinta arrivano dal tema.
 */
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, type Theme } from '@/theme';
import {
  ArticleGlyph,
  DocumentGlyph,
  InstagramLogo,
  NoteGlyph,
  TikTokLogo,
  YouTubeLogo,
} from '@/theme/icons';
import type { SourceType } from '@/types/domain';
import { Favicon } from './Favicon';

export type SourceStampSize = 'sm' | 'md' | 'lg';

export interface SourceStampProps {
  source: SourceType;
  /** @default "md" */
  size?: SourceStampSize;
  /** Mostra l'etichetta testuale accanto al quadrato. */
  showLabel?: boolean;
  /** Testo libero che sovrascrive l'etichetta di default (es. la testata). */
  label?: string;
  /** Host del dominio (per la favicon degli articoli). */
  host?: string | null;
  style?: StyleProp<ViewStyle>;
}

/** Sceglie la rappresentazione visiva della fonte dentro lo stamp. */
function SourceMark({ source, size, fg, host }: { source: SourceType; size: number; fg: string; host: string | null }): JSX.Element {
  switch (source) {
    case 'youtube':
      return <YouTubeLogo size={size} />;
    case 'reel':
      return <InstagramLogo size={size} />;
    case 'tiktok':
      return <TikTokLogo size={size} color={fg} />;
    case 'article':
      return <Favicon host={host} size={size} fallback={<ArticleGlyph size={size} color={fg} />} />;
    case 'document':
      return <DocumentGlyph size={size} color={fg} />;
    case 'other':
    default:
      return <NoteGlyph size={size} color={fg} />;
  }
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

export function SourceStamp({ source, size = 'md', showLabel = false, label, host = null, style }: SourceStampProps): JSX.Element {
  const theme = useTheme();
  const s = boxSpec(theme, size);
  const { fg, soft } = theme.sourceColor(source);

  const stamp = (
    <View
      style={[
        styles.box,
        { width: s.box, height: s.box, borderRadius: s.radius, backgroundColor: soft },
        !showLabel ? style : undefined,
      ]}
    >
      <SourceMark source={source} size={s.icon} fg={fg} host={host} />
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
