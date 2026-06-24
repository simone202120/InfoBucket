/**
 * Impostazioni (brief view #11): account, aspetto (accento + tema chiaro/scuro),
 * gestione dei bucket e nota sul ciclo di vita. Lo stile arriva tutto da
 * `useTheme()`; la logica dei bucket vive in `useBucketAdmin`.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth';
import { useBucketAdmin } from '@/features/settings/useBucketAdmin';
import { supabase } from '@/lib/supabase';
import {
  accents,
  FadeInUp,
  staggerDelay,
  useTheme,
  useThemeControls,
  type AccentName,
  type ThemeMode,
} from '@/theme';
import { AccentPicker, Button, ErrorBanner, TextField } from '@/theme/components';
import { CheckIcon, TrashIcon, XIcon } from '@/theme/icons';
import type { BucketOverview } from '@/types/domain';

/** Nomi degli accenti dal lato utente (sentence case, italiano). */
const ACCENT_LABEL: Record<AccentName, string> = {
  olive: 'Oliva',
  cobalt: 'Cobalto',
  seafoam: 'Acquamarina',
  blush: 'Rosa',
  tangerine: 'Mandarino',
  oxblood: 'Bordeaux',
  forest: 'Foresta',
  indigo: 'Indaco',
  ruby: 'Rubino',
  amber: 'Ambra',
};

/** Colore di partenza del selettore personalizzato quando non c'è ancora scelta. */
const DEFAULT_CUSTOM_COLOR = '#2D5AD9';

/** Opzioni di tema: null segue il sistema. */
const MODE_OPTIONS: readonly { label: string; value: ThemeMode | null }[] = [
  { label: 'Chiaro', value: 'light' },
  { label: 'Scuro', value: 'dark' },
  { label: 'Sistema', value: null },
];

const ACCENT_NAMES = Object.keys(accents) as AccentName[];

export default function SettingsScreen(): JSX.Element {
  const t = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: t.gutter,
          paddingVertical: t.space[4],
        }}
      >
        <Text
          style={{
            color: t.colors.textPrimary,
            fontFamily: t.font.displayBold,
            fontSize: t.type.title.size,
            lineHeight: t.type.title.lh,
          }}
        >
          Impostazioni
        </Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Chiudi" hitSlop={8}>
          <XIcon color={t.colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: t.gutter, gap: t.space[7], paddingBottom: t.space[9] }}>
        <FadeInUp delay={staggerDelay(0)}>
          <AccountSection />
        </FadeInUp>
        <FadeInUp delay={staggerDelay(1)}>
          <AppearanceSection />
        </FadeInUp>
        <FadeInUp delay={staggerDelay(2)}>
          <BucketsSection />
        </FadeInUp>
        <FadeInUp delay={staggerDelay(3)}>
          <LifecycleSection />
        </FadeInUp>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---- Intestazione di sezione condivisa --------------------------------- */

function SectionTitle({ children }: { children: string }): JSX.Element {
  const t = useTheme();
  return (
    <Text
      style={{
        marginBottom: t.space[4],
        fontFamily: t.font.mono,
        fontSize: t.type.label.size,
        letterSpacing: t.type.label.size * t.type.label.tracking,
        textTransform: 'uppercase',
        color: t.colors.textSecondary,
      }}
    >
      {children}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }): JSX.Element {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.colors.surface,
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: t.colors.border,
        padding: t.space[5],
        gap: t.space[4],
      }}
    >
      {children}
    </View>
  );
}

function BodyText({ children, secondary }: { children: React.ReactNode; secondary?: boolean }): JSX.Element {
  const t = useTheme();
  return (
    <Text
      style={{
        fontFamily: t.font.display,
        fontSize: t.type.body.size,
        lineHeight: t.type.body.lh,
        color: secondary ? t.colors.textSecondary : t.colors.textPrimary,
      }}
    >
      {children}
    </Text>
  );
}

/* ---- Account ----------------------------------------------------------- */

function AccountSection(): JSX.Element {
  const t = useTheme();
  const { user, signOut } = useAuth();
  // L'email può già essere nella sessione; in caso contrario la recuperiamo.
  const [email, setEmail] = useState<string | null>(user?.email ?? null);

  useEffect(() => {
    if (email) return;
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active && data.user?.email) setEmail(data.user.email);
    });
    return () => {
      active = false;
    };
  }, [email]);

  return (
    <View>
      <SectionTitle>Account</SectionTitle>
      <Card>
        <View style={{ gap: t.space[2] }}>
          <BodyText secondary>Hai eseguito l&apos;accesso come</BodyText>
          <BodyText>{email ?? '—'}</BodyText>
        </View>
        <Button variant="secondary" onPress={() => void signOut()} accessibilityLabel="Esci">
          Esci
        </Button>
      </Card>
    </View>
  );
}

/* ---- Aspetto ----------------------------------------------------------- */

function AppearanceSection(): JSX.Element {
  const t = useTheme();
  const { setAccent, setCustomAccent, setModeOverride, modeOverride, accentName, customColor } = useThemeControls();
  const isCustom = accentName === 'custom';

  return (
    <View>
      <SectionTitle>Aspetto</SectionTitle>
      <Card>
        <BodyText secondary>Accento</BodyText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
          {ACCENT_NAMES.map((name) => (
            <AccentChip
              key={name}
              name={name}
              active={accentName === name}
              onPress={() => setAccent(name)}
            />
          ))}
          <CustomAccentChip
            active={isCustom}
            color={customColor ?? DEFAULT_CUSTOM_COLOR}
            onPress={() => setCustomAccent(customColor ?? DEFAULT_CUSTOM_COLOR)}
          />
        </View>
        {isCustom ? (
          <AccentPicker value={customColor ?? DEFAULT_CUSTOM_COLOR} onChange={setCustomAccent} />
        ) : null}

        <BodyText secondary>Tema</BodyText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
          {MODE_OPTIONS.map((opt) => (
            <ChoiceChip
              key={opt.label}
              label={opt.label}
              active={modeOverride === opt.value}
              onPress={() => setModeOverride(opt.value)}
            />
          ))}
        </View>
      </Card>
    </View>
  );
}

function AccentChip({ name, active, onPress }: { name: AccentName; active: boolean; onPress: () => void }): JSX.Element {
  const t = useTheme();
  const swatch = accents[name][t.mode];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Accento ${ACCENT_LABEL[name]}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space[3],
        minHeight: t.touchMin,
        paddingHorizontal: t.space[4],
        borderRadius: t.radius.sm,
        borderWidth: 1.5,
        borderColor: active ? swatch : t.colors.border,
        backgroundColor: active ? t.colors.surfaceHover : t.colors.surface,
      }}
    >
      <View style={{ width: 18, height: 18, borderRadius: t.radius.pill, backgroundColor: swatch }} />
      <Text style={{ fontFamily: t.font.display, fontSize: t.type.body.size, color: t.colors.textPrimary }}>
        {ACCENT_LABEL[name]}
      </Text>
    </Pressable>
  );
}

/** Chip "Personalizza": apre il selettore del colore d'accento su misura. */
function CustomAccentChip({ active, color, onPress }: { active: boolean; color: string; onPress: () => void }): JSX.Element {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel="Accento personalizzato"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space[3],
        minHeight: t.touchMin,
        paddingHorizontal: t.space[4],
        borderRadius: t.radius.sm,
        borderWidth: 1.5,
        borderColor: active ? color : t.colors.border,
        backgroundColor: active ? t.colors.surfaceHover : t.colors.surface,
      }}
    >
      <View style={{ width: 18, height: 18, borderRadius: t.radius.pill, backgroundColor: color, borderWidth: 1, borderColor: t.colors.border }} />
      <Text style={{ fontFamily: t.font.display, fontSize: t.type.body.size, color: t.colors.textPrimary }}>
        Personalizza
      </Text>
    </Pressable>
  );
}

function ChoiceChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }): JSX.Element {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space[2],
        minHeight: t.touchMin,
        paddingHorizontal: t.space[5],
        borderRadius: t.radius.sm,
        borderWidth: 1.5,
        borderColor: active ? t.colors.primary : t.colors.border,
        backgroundColor: active ? t.colors.primarySoft : t.colors.surface,
      }}
    >
      {active ? <CheckIcon size={16} color={t.colors.primary} /> : null}
      <Text
        style={{
          fontFamily: t.font.display,
          fontSize: t.type.body.size,
          color: active ? t.colors.primary : t.colors.textPrimary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ---- I tuoi bucket ----------------------------------------------------- */

function BucketsSection(): JSX.Element {
  const t = useTheme();
  const { buckets, loading, error, refetch, rename, remove } = useBucketAdmin();

  return (
    <View>
      <SectionTitle>I tuoi bucket</SectionTitle>
      {error ? <ErrorBanner message={error} onAction={refetch} /> : null}

      {loading && buckets.length === 0 ? (
        <View style={{ paddingVertical: t.space[6], alignItems: 'center' }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      ) : buckets.length === 0 ? (
        <Card>
          <BodyText secondary>Non hai ancora bucket. Salva un elemento in un bucket per crearne uno.</BodyText>
        </Card>
      ) : (
        <View style={{ gap: t.space[4] }}>
          {buckets.map((bucket) => (
            <BucketRow key={bucket.id} bucket={bucket} onRename={rename} onRemove={remove} />
          ))}
          <BodyText secondary>Eliminare un bucket non cancella gli elementi salvati: tornano senza bucket.</BodyText>
        </View>
      )}
    </View>
  );
}

function itemCountLabel(count: number): string {
  return count === 1 ? '1 elemento' : `${count} elementi`;
}

function BucketRow({
  bucket,
  onRename,
  onRemove,
}: {
  bucket: BucketOverview;
  onRename: (id: string, name: string) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
}): JSX.Element {
  const t = useTheme();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(bucket.name);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const startEdit = (): void => {
    setName(bucket.name);
    setFieldError(null);
    setEditing(true);
  };

  const cancelEdit = (): void => {
    setEditing(false);
    setFieldError(null);
  };

  const save = async (): Promise<void> => {
    const clean = name.trim();
    if (!clean) {
      setFieldError('Dai un nome al bucket.');
      return;
    }
    setSaving(true);
    const ok = await onRename(bucket.id, clean);
    setSaving(false);
    if (ok) setEditing(false);
  };

  const confirmRemove = (): void => {
    Alert.alert(
      'Eliminare il bucket?',
      `"${bucket.name}" verrà eliminato. Gli elementi salvati restano, ma senza bucket.`,
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: () => void onRemove(bucket.id) },
      ],
    );
  };

  return (
    <Card>
      {editing ? (
        <View style={{ gap: t.space[4] }}>
          <TextField
            label="Nome"
            value={name}
            onChangeText={setName}
            error={fieldError ?? undefined}
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={() => void save()}
          />
          <View style={{ flexDirection: 'row', gap: t.space[3] }}>
            <Button onPress={() => void save()} disabled={saving} accessibilityLabel="Salva">
              Salva
            </Button>
            <Button variant="ghost" onPress={cancelEdit} accessibilityLabel="Annulla">
              Annulla
            </Button>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[4] }}>
          <View style={{ flex: 1, minWidth: 0, gap: t.space[1] }}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: t.font.display, fontSize: t.type.subheading.size, color: t.colors.textPrimary }}
            >
              {bucket.name}
            </Text>
            <BodyText secondary>{itemCountLabel(bucket.itemCount)}</BodyText>
          </View>
          <Button size="sm" variant="secondary" onPress={startEdit} accessibilityLabel={`Rinomina ${bucket.name}`}>
            Rinomina
          </Button>
          <Pressable
            onPress={confirmRemove}
            accessibilityRole="button"
            accessibilityLabel={`Elimina ${bucket.name}`}
            hitSlop={8}
            style={{
              width: t.touchMin,
              height: t.touchMin,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: t.radius.sm,
            }}
          >
            <TrashIcon size={20} color={t.colors.danger} />
          </Pressable>
        </View>
      )}
    </Card>
  );
}

/* ---- Ciclo di vita ----------------------------------------------------- */

function LifecycleSection(): JSX.Element {
  return (
    <View>
      <SectionTitle>Ciclo di vita</SectionTitle>
      <Card>
        <BodyText secondary>
          Un elemento che non confermi resta in Inbox per 7 giorni, poi passa in Archivio, dove puoi ancora
          recuperarlo.
        </BodyText>
        <BodyText secondary>
          Dopo altri 20 giorni in Archivio viene eliminato. Quello che salvi in un bucket, invece, resta per sempre.
        </BodyText>
      </Card>
    </View>
  );
}
