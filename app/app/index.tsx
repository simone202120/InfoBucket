import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

/**
 * Schermata placeholder delle fondamenta. Verrà sostituita dall'Inbox in Fase 1.
 * Mostra che l'adapter del tema funziona end-to-end (colori, font, spaziature).
 */
export default function Home() {
  const t = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg, padding: t.gutter }]}>
      <Text
        style={{
          color: t.colors.textPrimary,
          fontFamily: t.font.displayBold,
          fontSize: t.type.title.size,
          lineHeight: t.type.title.lh,
        }}
      >
        InfoBucket
      </Text>
      <Text
        style={{
          color: t.colors.textSecondary,
          fontFamily: t.font.read,
          fontSize: t.type.read.size,
          lineHeight: t.type.read.lh,
          marginTop: t.space[4],
        }}
      >
        Fondamenta pronte. L'Inbox arriva nella Fase 1.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
});
