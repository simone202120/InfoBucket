import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useArchive } from '@/features/archive/useArchive';
import { daysLeft } from '@/lib/lifecycle';
import { hostnameOf } from '@/lib/source';
import { useTheme } from '@/theme';
import { EmptyState, ErrorBanner, ItemCard } from '@/theme/components';
import { ArchiveIcon, XIcon } from '@/theme/icons';
import type { Item } from '@/types/domain';

/** Archivio: elementi decaduti, recuperabili salvandoli in un bucket (§10). */
export default function ArchiveScreen() {
  const t = useTheme();
  const router = useRouter();
  const { items, loading, refreshing, error, refetch } = useArchive();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: t.gutter, paddingVertical: t.space[4] }}>
        <Text style={{ color: t.colors.textPrimary, fontFamily: t.font.displayBold, fontSize: t.type.title.size, lineHeight: t.type.title.lh }}>
          Archivio
        </Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Chiudi" hitSlop={8}>
          <XIcon color={t.colors.textSecondary} />
        </Pressable>
      </View>

      {error ? (
        <View style={{ paddingHorizontal: t.gutter }}>
          <ErrorBanner message={error} onAction={refetch} />
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: t.gutter, gap: t.space[4], flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={t.colors.primary} />}
          renderItem={({ item }) => <ArchivedCard item={item} onPress={() => router.push(`/item/${item.id}`)} />}
          ListEmptyComponent={
            <EmptyState
              icon={<ArchiveIcon color={t.colors.textTertiary} />}
              title="Archivio vuoto"
              body="Qui finiscono gli elementi non confermati in tempo. Restano recuperabili per 20 giorni."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function ArchivedCard({ item, onPress }: { item: Item; onPress: () => void }) {
  const left = daysLeft(item) ?? undefined;
  // In archivio il countdown indica i giorni alla cancellazione: usalo come segnale.
  const expiring = left !== undefined && left <= 3;
  return (
    <ItemCard
      source={item.sourceType}
      sourceName={item.sourceUrl ? hostnameOf(item.sourceUrl) ?? undefined : undefined}
      summary={item.summary ?? item.note ?? undefined}
      tags={item.tags}
      status={expiring ? 'expiring' : 'archived'}
      daysLeft={expiring ? left : undefined}
      onPress={onPress}
    />
  );
}
