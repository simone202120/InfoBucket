import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusRefetch } from '@/features/useFocusRefetch';
import { usePolling } from '@/features/usePolling';
import { useInbox } from '@/features/inbox/useInbox';
import { archiveItem } from '@/lib/items';
import { daysLeft, isExpiring } from '@/lib/lifecycle';
import { hostnameOf } from '@/lib/source';
import { useAuth } from '@/features/auth';
import { FadeInUp, staggerDelay, useTheme, useToast } from '@/theme';
import { haptics } from '@/theme/haptics';
import { AvatarMenu, EmptyState, ErrorBanner, ItemCard, ListSkeleton, ScreenHeader, type ProposedBucket } from '@/theme/components';
import { ArchiveIcon, InboxIcon } from '@/theme/icons';
import type { Item } from '@/types/domain';

export default function InboxScreen() {
  const t = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const { items, loading, refreshing, error, refetch } = useInbox();
  useFocusRefetch(refetch);
  usePolling(refetch, { active: items.some((it) => it.status === 'processing') });

  const openAdd = () => router.push('/add');

  /** Archivia dallo swipe: feedback aptico, poi ricarica. Errore → toast, dati salvi. */
  const archive = async (id: string) => {
    try {
      await archiveItem(id);
      haptics.success();
      await refetch();
    } catch {
      showToast({ message: 'Impossibile archiviare. Riprova.' });
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScreenHeader
        kicker={items.length > 0 ? `${items.length} da rivedere` : undefined}
        title="Inbox"
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
            <Pressable onPress={() => router.push('/archive')} accessibilityRole="button" accessibilityLabel="Archivio" hitSlop={8} style={{ padding: t.space[2] }}>
              <ArchiveIcon color={t.colors.textSecondary} size={22} />
            </Pressable>
            <AvatarMenu
              email={user?.email ?? null}
              onOpenSettings={() => router.push('/settings')}
              onSignOut={() => void signOut()}
            />
          </View>
        }
      />

      {error ? (
        <View style={{ paddingHorizontal: t.gutter }}>
          <ErrorBanner message={error} onAction={refetch} />
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <View style={{ padding: t.gutter }}>
          <ListSkeleton />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: t.gutter, gap: t.space[4], flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={t.colors.primary} />}
          renderItem={({ item, index }) => (
            <FadeInUp delay={staggerDelay(index)}>
              <InboxItem
                item={item}
                onPress={() => router.push(`/item/${item.id}`)}
                onArchive={() => void archive(item.id)}
              />
            </FadeInUp>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<InboxIcon color={t.colors.textTertiary} />}
              title="Tutto sistemato"
              body="Niente da rivedere. Aggiungi un link per iniziare."
              actionLabel="Aggiungi un link"
              onAction={openAdd}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

/** Mappa un Item di dominio sulla ItemCard. */
function InboxItem({ item, onPress, onArchive }: { item: Item; onPress: () => void; onArchive: () => void }) {
  const status = item.status === 'processing' ? 'processing' : isExpiring(item) ? 'expiring' : 'ready';
  const left = daysLeft(item) ?? undefined;
  const proposed: ProposedBucket | undefined = item.suggestedBucketName
    ? { name: item.suggestedBucketName, isNew: true }
    : undefined;

  return (
    <ItemCard
      source={item.sourceType}
      sourceName={item.sourceUrl ? hostnameOf(item.sourceUrl) ?? undefined : undefined}
      summary={item.summary ?? item.note ?? undefined}
      tags={item.tags}
      status={status}
      proposedBucket={proposed}
      daysLeft={status === 'expiring' ? left : undefined}
      onPress={onPress}
      onArchive={onArchive}
      onReview={onPress}
    />
  );
}
