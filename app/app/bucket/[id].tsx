import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBucketDetail } from '@/features/library/useBucketDetail';
import { hostnameOf } from '@/lib/source';
import { FadeInUp, staggerDelay, useTheme } from '@/theme';
import { EmptyState, ErrorBanner, ItemCard } from '@/theme/components';
import { LibraryIcon, XIcon } from '@/theme/icons';
import type { Item } from '@/types/domain';

/** Dettaglio bucket: gli elementi salvati al suo interno. */
export default function BucketDetailScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bucketId = id ?? '';
  const { bucket, items, loading, refreshing, error, refetch } = useBucketDetail(bucketId);

  const title = bucket?.name ?? 'Bucket';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: t.gutter, paddingVertical: t.space[4] }}>
        <Text numberOfLines={1} style={{ flex: 1, marginRight: t.space[3], color: t.colors.textPrimary, fontFamily: t.font.displayBold, fontSize: t.type.title.size, lineHeight: t.type.title.lh }}>
          {title}
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
          renderItem={({ item, index }) => (
            <FadeInUp delay={staggerDelay(index)}>
              <BucketItem item={item} onPress={() => router.push(`/item/${item.id}`)} />
            </FadeInUp>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<LibraryIcon color={t.colors.textTertiary} />}
              title="Bucket vuoto"
              body="Niente qui dentro. Conferma un elemento dall'Inbox per salvarlo in questo bucket."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

/** Mappa un Item salvato sulla ItemCard (stessa logica dell'Inbox, senza countdown). */
function BucketItem({ item, onPress }: { item: Item; onPress: () => void }) {
  return (
    <ItemCard
      source={item.sourceType}
      sourceName={item.sourceUrl ? hostnameOf(item.sourceUrl) ?? undefined : undefined}
      title={item.summary ? undefined : item.note ?? undefined}
      summary={item.summary ?? item.note ?? undefined}
      tags={item.tags}
      status="saved"
      onPress={onPress}
    />
  );
}
