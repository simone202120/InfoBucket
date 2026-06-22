import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { EmptyState } from '@/theme/components';
import { LibraryIcon } from '@/theme/icons';

/** Placeholder Libreria — i bucket arrivano in una fase successiva. */
export default function LibraryScreen() {
  const t = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: t.gutter }}>
        <EmptyState
          icon={<LibraryIcon color={t.colors.textTertiary} />}
          title="Libreria in arrivo"
          body="Qui troverai i tuoi bucket salvati."
        />
      </View>
    </SafeAreaView>
  );
}
