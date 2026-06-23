import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth';
import { useFocusRefetch } from '@/features/useFocusRefetch';
import { useLibrary } from '@/features/library/useLibrary';
import { createBucket } from '@/lib/buckets';
import { FadeInUp, staggerDelay, useTheme } from '@/theme';
import {
  AvatarMenu,
  BucketCard,
  Button,
  EmptyState,
  ErrorBanner,
  ListSkeleton,
  NoteField,
  TextField,
} from '@/theme/components';
import { LibraryIcon, PlusIcon, XIcon } from '@/theme/icons';

/** Libreria: tutti i bucket dell'utente, con creazione inline di un nuovo bucket. */
export default function LibraryScreen() {
  const t = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { buckets, loading, refreshing, error, refetch } = useLibrary();
  useFocusRefetch(refetch);
  const [creating, setCreating] = useState(false);

  const onCreated = async () => {
    setCreating(false);
    await refetch();
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: t.gutter, paddingVertical: t.space[4] }}>
        <Text style={{ color: t.colors.textPrimary, fontFamily: t.font.displayBold, fontSize: t.type.title.size, lineHeight: t.type.title.lh }}>
          Libreria
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[1] }}>
          <Button variant="ghost" size="sm" iconLeft={<PlusIcon color={t.colors.primary} size={18} />} onPress={() => setCreating(true)}>
            Nuovo bucket
          </Button>
          <AvatarMenu
            email={user?.email ?? null}
            onOpenSettings={() => router.push('/settings')}
            onSignOut={() => void signOut()}
          />
        </View>
      </View>

      {error ? (
        <View style={{ paddingHorizontal: t.gutter }}>
          <ErrorBanner message={error} onAction={refetch} />
        </View>
      ) : null}

      {loading && buckets.length === 0 ? (
        <View style={{ padding: t.gutter }}>
          <ListSkeleton />
        </View>
      ) : (
        <FlatList
          data={buckets}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: t.gutter, gap: t.space[4], flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={t.colors.primary} />}
          renderItem={({ item, index }) => (
            <FadeInUp delay={staggerDelay(index)}>
              <BucketCard
                name={item.name}
                count={item.itemCount}
                description={item.description}
                sources={item.sources}
                onPress={() => router.push({ pathname: '/bucket/[id]', params: { id: item.id } })}
              />
            </FadeInUp>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<LibraryIcon color={t.colors.textTertiary} />}
              title="Nessun bucket ancora"
              body="Crea un bucket per raccogliere ciò che salvi. Una descrizione aiuta l'AI a proporlo."
              actionLabel="Nuovo bucket"
              onAction={() => setCreating(true)}
            />
          }
        />
      )}

      <NewBucketModal visible={creating} onClose={() => setCreating(false)} onCreated={onCreated} />
    </SafeAreaView>
  );
}

/** Modale di creazione di un bucket: nome + descrizione opzionale (hint per l'AI). */
function NewBucketModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const t = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setName('');
    setDescription('');
    setError(null);
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await createBucket({ name, description });
      reset();
      await onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossibile creare il bucket.');
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: t.gutter, paddingVertical: t.space[4] }}>
          <Text style={{ color: t.colors.textPrimary, fontFamily: t.font.displayBold, fontSize: t.type.heading.size, lineHeight: t.type.heading.lh }}>
            Nuovo bucket
          </Text>
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Chiudi" hitSlop={8}>
            <XIcon color={t.colors.textSecondary} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, paddingHorizontal: t.gutter, gap: t.space[5] }}
        >
          {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

          <TextField
            label="Nome"
            value={name}
            onChangeText={setName}
            placeholder="Es. Machine learning"
            autoCapitalize="sentences"
          />
          <NoteField
            label="Descrizione"
            value={description}
            onChangeText={setDescription}
            placeholder="La descrizione aiuta l'AI a scegliere il bucket."
          />

          <Button onPress={save} fullWidth disabled={busy || !name.trim()}>
            Crea bucket
          </Button>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
