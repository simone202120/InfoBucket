/**
 * TranscriptSheet — pannello a tutta pagina che sale dal basso con il testo
 * estratto completo (trascrizione di un video o testo di un articolo), leggibile
 * in Newsreader. Usato dalla ReviewScreen per esporre il raw_content senza
 * troncare. Stile interamente dal tema.
 */
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { XIcon } from '@/theme/icons';

export interface TranscriptSheetProps {
  visible: boolean;
  title: string;
  text: string;
  onClose: () => void;
}

export function TranscriptSheet({ visible, title, text, onClose }: TranscriptSheetProps): JSX.Element {
  const t = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {/* Header: titolo + tasto chiudi con target ≥44pt */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: t.gutter,
            paddingVertical: t.space[4],
          }}
        >
          <Text
            style={{
              color: t.colors.textPrimary,
              fontFamily: t.font.displayBold,
              fontSize: t.type.heading.size,
              lineHeight: t.type.heading.lh,
            }}
          >
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Chiudi"
            hitSlop={8}
            style={{ minWidth: t.touchMin, minHeight: t.touchMin, alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <XIcon color={t.colors.textSecondary} />
          </Pressable>
        </View>

        {/* Corpo: testo completo scorrevole in Newsreader */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: t.gutter, paddingBottom: t.space[9] }}
        >
          <Text
            style={{
              fontFamily: t.font.read,
              fontSize: t.type.read.size,
              lineHeight: t.type.read.lh,
              color: t.colors.textPrimary,
            }}
          >
            {text}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
