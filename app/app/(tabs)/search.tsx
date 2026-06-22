import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { EmptyState } from '@/theme/components';
import { SearchIcon } from '@/theme/icons';

/** Placeholder Cerca — la ricerca ibrida arriva nella Fase 4. */
export default function SearchScreen() {
  const t = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: t.gutter }}>
        <EmptyState
          icon={<SearchIcon color={t.colors.textTertiary} />}
          title="Cerca in arrivo"
          body="Presto potrai ritrovare tutto per significato."
        />
      </View>
    </SafeAreaView>
  );
}
