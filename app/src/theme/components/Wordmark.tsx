/**
 * Wordmark — il marchio di InfoBucket: il glifo a trattini-provenienza (le
 * famiglie di fonti a colori) accanto/sopra il logotype in Bricolage. Usato nel
 * login e nello splash. Stile dal tema.
 */
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';

export interface WordmarkProps {
  size?: 'lg' | 'sm';
}

const TICKS: { key: string; h: number }[] = [
  { key: 'article', h: 14 },
  { key: 'video', h: 22 },
  { key: 'social', h: 18 },
  { key: 'document', h: 26 },
];

export function Wordmark({ size = 'lg' }: WordmarkProps): JSX.Element {
  const t = useTheme();
  const fontSize = size === 'lg' ? t.type.display.size : t.type.title.size;
  return (
    <View style={{ gap: t.space[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 28 }}>
        {TICKS.map((tick) => (
          <View key={tick.key} style={{ width: 7, height: tick.h, borderRadius: 3, backgroundColor: t.colors.src[tick.key as keyof typeof t.colors.src] }} />
        ))}
      </View>
      <Text style={{ fontFamily: t.font.displayBold, fontSize, letterSpacing: -0.5, color: t.colors.textPrimary }}>
        InfoBucket
      </Text>
    </View>
  );
}
