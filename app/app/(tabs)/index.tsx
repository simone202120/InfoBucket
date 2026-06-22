import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth';
import { useInbox } from '@/features/inbox/useInbox';
import { daysLeft, isExpiring } from '@/lib/lifecycle';
import { hostnameOf } from '@/lib/source';
import { useTheme } from '@/theme';
import { AddButton, Button, EmptyState, ErrorBanner, ItemCard, type ProposedBucket } from '@/theme/components';
import { InboxIcon } from '@/theme/icons';
import type { Item } from '@/types/domain';

export default function InboxScreen() {
  const t = useTheme();
  const router = useRouter();
  const { signOut } = useAuth();
  const { items, loading, refreshing, error, refetch } = useInbox();

  const openAdd = () => router.push('/add');

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: t.gutter, paddingVertical: t.space[4] }}>
        <Text style={{ color: t.colors.textPrimary, fontFamily: t.font.displayBold, fontSize: t.type.title.size, lineHeight: t.type.title.lh }}>
          Inbox
        </Text>
        <Button variant="ghost" size="sm" onPress={signOut}>Esci</Button>
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
          renderItem={({ item }) => <InboxItem item={item} />}
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

      <View style={{ position: 'absolute', right: t.gutter, bottom: t.space[7] }}>
        <AddButton onPress={openAdd} />
      </View>
    </SafeAreaView>
  );
}

/** Mappa un Item di dominio sulla ItemCard. */
function InboxItem({ item }: { item: Item }) {
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
    />
  );
}
