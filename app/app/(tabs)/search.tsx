import { useRouter } from 'expo-router';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth';
import { useSearch } from '@/features/search/useSearch';
import { daysLeft, isExpiring } from '@/lib/lifecycle';
import { hostnameOf } from '@/lib/source';
import { useTheme } from '@/theme';
import { AvatarMenu, EmptyState, ErrorBanner, ItemCard, ListSkeleton, ScreenHeader, TextField } from '@/theme/components';
import { SearchIcon } from '@/theme/icons';
import type { Item } from '@/types/domain';

/** Ricerca a campo libero: risultati ibridi (semantica + keyword) fra saved/archived. */
export default function SearchScreen() {
  const t = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { query, setQuery, results, loading, error, searched, run } = useSearch();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScreenHeader
        title="Cerca"
        right={
          <AvatarMenu
            email={user?.email ?? null}
            onOpenSettings={() => router.push('/settings')}
            onSignOut={() => void signOut()}
          />
        }
      />
      <View style={{ paddingHorizontal: t.gutter, paddingBottom: t.space[2] }}>
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

      {loading && results.length === 0 ? (
        <View style={{ padding: t.gutter }}>
          <ListSkeleton />
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
