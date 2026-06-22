import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSearch } from '@/features/search/useSearch';
import { daysLeft, isExpiring } from '@/lib/lifecycle';
import { hostnameOf } from '@/lib/source';
import { useTheme } from '@/theme';
import { EmptyState, ErrorBanner, ItemCard, TextField } from '@/theme/components';
import { SearchIcon } from '@/theme/icons';
import type { Item } from '@/types/domain';

/** Ricerca a campo libero: risultati ibridi (semantica + keyword) fra saved/archived. */
export default function SearchScreen() {
  const t = useTheme();
  const router = useRouter();
  const { query, setQuery, results, loading, error, searched, run } = useSearch();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ paddingHorizontal: t.gutter, paddingTop: t.space[4], paddingBottom: t.space[2], gap: t.space[4] }}>
        <Text style={{ color: t.colors.textPrimary, fontFamily: t.font.displayBold, fontSize: t.type.title.size, lineHeight: t.type.title.lh }}>
          Cerca
        </Text>
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Cerca per significato o parola"
          autoCapitalize="none"
          iconLeft={<SearchIcon color={t.colors.textTertiary} size={18} />}
          onSubmitEditing={run}
          returnKeyType="search"
        />
      </View>

      {error ? (
        <View style={{ paddingHorizontal: t.gutter }}>
          <ErrorBanner message={error} onAction={run} />
        </View>
      ) : null}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: t.gutter, gap: t.space[4], flexGrow: 1 }}
          renderItem={({ item }) => <ResultCard item={item} onPress={() => router.push(`/item/${item.id}`)} />}
          ListEmptyComponent={
            <EmptyState
              icon={<SearchIcon color={t.colors.textTertiary} />}
              title={searched ? 'Nessun risultato' : 'Cerca tra le tue cose'}
              body={searched ? 'Prova con altre parole.' : 'Ritrova per significato gli elementi salvati e archiviati.'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function ResultCard({ item, onPress }: { item: Item; onPress: () => void }) {
  const status = isExpiring(item) ? 'expiring' : item.status;
  return (
    <ItemCard
      source={item.sourceType}
      sourceName={item.sourceUrl ? hostnameOf(item.sourceUrl) ?? undefined : undefined}
      summary={item.summary ?? item.note ?? undefined}
      tags={item.tags}
      status={status === 'archived' ? 'archived' : status}
      daysLeft={status === 'expiring' ? daysLeft(item) ?? undefined : undefined}
      onPress={onPress}
    />
  );
}
