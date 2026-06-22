import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addItemByUrl, ItemsError } from '@/lib/items';
import { useTheme } from '@/theme';
import { Button, ErrorBanner, NoteField, TextField } from '@/theme/components';
import { LinkIcon, XIcon } from '@/theme/icons';

/** Cattura manuale: incolla un URL + nota opzionale (spec §16 Fase 1). */
export default function AddScreen() {
  const t = useTheme();
  const router = useRouter();
  // Precompilato quando si arriva da una condivisione (share intent, §12).
  const { url: sharedUrl } = useLocalSearchParams<{ url?: string }>();
  const [url, setUrl] = useState(sharedUrl ?? '');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => router.back();

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await addItemByUrl({ url, note });
      close();
    } catch (e) {
      setError(e instanceof ItemsError ? e.message : 'Impossibile salvare il link.');
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: t.gutter, paddingVertical: t.space[4] }}>
        <Text style={{ color: t.colors.textPrimary, fontFamily: t.font.displayBold, fontSize: t.type.heading.size, lineHeight: t.type.heading.lh }}>
          Aggiungi
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
          label="Link"
          value={url}
          onChangeText={setUrl}
          placeholder="https://…"
          keyboardType="url"
          autoCapitalize="none"
          iconLeft={<LinkIcon color={t.colors.textTertiary} size={18} />}
        />
        <NoteField
          label="Nota"
          value={note}
          onChangeText={setNote}
          placeholder="Perché lo salvi? (opzionale)"
        />

        <Button onPress={save} fullWidth disabled={busy || !url.trim()}>
          Salva
        </Button>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
