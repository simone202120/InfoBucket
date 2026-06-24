/**
 * ReviewScreen — il dettaglio di un elemento dell'Inbox (spec §9). L'utente
 * rivede ciò che l'AI ha proposto (riassunto, tag, bucket), lo corregge e
 * conferma. Il riassunto è l'eroe: leggibile in Newsreader e modificabile.
 * La conferma è il gesto che "salva" l'elemento e lo rende permanente.
 * Tutto lo stile arriva da `useTheme()`; la logica dati sta in `useItemDetail`.
 */
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useFocusRefetch } from '@/features/useFocusRefetch';
import { usePolling } from '@/features/usePolling';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hostnameOf, isValidHttpUrl } from '@/lib/source';
import { useTheme, useToast, type Theme } from '@/theme';
import { haptics } from '@/theme/haptics';
import {
  BucketChip,
  Button,
  ErrorBanner,
  NoteField,
  SourceStamp,
  StatusBadge,
  Tag,
  TextField,
  TranscriptSheet,
} from '@/theme/components';
import { LinkIcon, PlusIcon, RefreshIcon, TrashIcon } from '@/theme/icons';
import type { BadgeStatus } from '@/theme/components';
import type { Item } from '@/types/domain';
import { useItemDetail, type ConfirmTarget } from './useItemDetail';

export interface ReviewScreenProps {
  id: string;
}

export function ReviewScreen({ id }: ReviewScreenProps): JSX.Element {
  const t = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const {
    item,
    buckets,
    loading,
    saving,
    regenerating,
    confirming,
    error,
    refetch,
    save,
    regenerateItem,
    confirm,
    remove,
  } = useItemDetail(id);
  useFocusRefetch(refetch);
  usePolling(refetch, { active: item?.status === 'processing' });

  if (loading && !item) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen>
        <Header onClose={() => router.back()} />
        <View style={{ paddingHorizontal: t.gutter }}>
          <ErrorBanner
            message={error ?? 'Elemento non trovato.'}
            actionLabel="Torna alla Inbox"
            onAction={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header onClose={() => router.back()} />
      <ReviewBody
        item={item}
        buckets={buckets}
        saving={saving}
        regenerating={regenerating}
        confirming={confirming}
        error={error}
        onSave={save}
        onRegenerate={regenerateItem}
        onConfirm={async (target, displayName) => {
          const ok = await confirm(target);
          if (ok) {
            showToast({ message: `Salvato in «${displayName}»` });
            haptics.success();
            router.back();
          }
          return ok;
        }}
        onRemove={async () => {
          const ok = await remove();
          if (ok) router.back();
        }}
      />
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }): JSX.Element {
  const t = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {children}
    </SafeAreaView>
  );
}

function Header({ onClose }: { onClose: () => void }): JSX.Element {
  const t = useTheme();
  return (
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
          fontSize: t.type.heading.size,
          lineHeight: t.type.heading.lh,
        }}
      >
        Rivedi
      </Text>
      <Button variant="ghost" size="sm" onPress={onClose}>
        Chiudi
      </Button>
    </View>
  );
}

interface ReviewBodyProps {
  item: Item;
  buckets: ReturnType<typeof useItemDetail>['buckets'];
  saving: boolean;
  regenerating: boolean;
  confirming: boolean;
  error: string | null;
  onSave: ReturnType<typeof useItemDetail>['save'];
  onRegenerate: ReturnType<typeof useItemDetail>['regenerateItem'];
  onConfirm: (target: ConfirmTarget, displayName: string) => Promise<boolean>;
  onRemove: () => void;
}

function ReviewBody({
  item,
  buckets,
  saving,
  regenerating,
  confirming,
  error,
  onSave,
  onRegenerate,
  onConfirm,
  onRemove,
}: ReviewBodyProps): JSX.Element {
  const t = useTheme();

  // Stato editabile, inizializzato dall'item e ri-sincronizzato a ogni ricarica
  // (es. dopo una rigenerazione, che sostituisce riassunto/tag dal server).
  const [summary, setSummary] = useState(item.summary ?? '');
  const [note, setNote] = useState(item.note ?? '');
  const [tags, setTags] = useState<string[]>(item.tags);
  const [newTag, setNewTag] = useState('');
  // Apertura dello sheet con testo/trascrizione completa.
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setSummary(item.summary ?? '');
    setNote(item.note ?? '');
    setTags(item.tags);
  }, [item]);

  const dirty = useMemo(
    () => summary !== (item.summary ?? '') || note !== (item.note ?? '') || !sameTags(tags, item.tags),
    [summary, note, tags, item],
  );

  const sourceUrl = item.sourceUrl;
  const canOpenSource = sourceUrl !== null && isValidHttpUrl(sourceUrl);
  const openSource = () => {
    if (canOpenSource && sourceUrl) void Linking.openURL(sourceUrl);
  };

  const addTag = () => {
    const clean = newTag.trim().replace(/^#/, '');
    if (!clean || tags.includes(clean)) {
      setNewTag('');
      return;
    }
    setTags((prev) => [...prev, clean]);
    setNewTag('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((it) => it !== tag));

  const saveEdits = () => void onSave({ summary, note, tags });

  const confirmRemove = () => {
    Alert.alert(
      'Eliminare l\'elemento?',
      'L\'azione è definitiva e non si può annullare.',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: onRemove },
      ],
      { cancelable: true },
    );
  };

  const raw = item.rawContent?.trim() ?? '';
  const hasText = raw.length > 0;
  const isAv = item.sourceType === 'youtube' || item.sourceType === 'reel' || item.sourceType === 'tiktok';
  const textLabel = isAv ? 'trascrizione' : 'testo';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ padding: t.gutter, gap: t.space[6], paddingBottom: t.space[8] }}
        keyboardShouldPersistTaps="handled"
      >
        {error ? <ErrorBanner message={error} /> : null}

        {/* Intestazione: provenienza + stato + link alla fonte */}
        <View style={{ gap: t.space[4] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space[4] }}>
            <SourceStamp
              source={item.sourceType}
              size="md"
              showLabel
              label={sourceName(item)}
              host={item.sourceUrl ? hostnameOf(item.sourceUrl) : null}
              style={{ flexShrink: 1 }}
            />
            <StatusBadge status={badgeStatus(item.status)} />
          </View>
          {canOpenSource ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Apri la fonte"
              onPress={openSource}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], minHeight: t.touchMin }}
            >
              <LinkIcon size={16} color={t.colors.primary} />
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontFamily: t.font.mono,
                  fontSize: t.type.bodySm.size,
                  color: t.colors.primary,
                }}
              >
                {sourceUrl}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Riassunto — l'eroe, modificabile */}
        <Field label="Riassunto">
          <View
            style={{
              backgroundColor: t.colors.surface,
              borderColor: t.colors.borderStrong,
              borderWidth: 1.5,
              borderRadius: t.radius.sm,
              padding: t.space[4],
            }}
          >
            <TextInput
              accessibilityLabel="Riassunto"
              value={summary}
              onChangeText={setSummary}
              placeholder="Scrivi un riassunto, o rigenera per proporne uno."
              placeholderTextColor={t.colors.textTertiary}
              multiline
              textAlignVertical="top"
              style={{
                minHeight: t.type.read.lh * 3,
                fontFamily: t.font.read,
                fontSize: t.type.read.size,
                lineHeight: t.type.read.lh,
                color: t.colors.textPrimary,
              }}
            />
          </View>
        </Field>

        {/* Tag modificabili */}
        <Field label="Tag">
          {tags.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3], marginBottom: t.space[3] }}>
              {tags.map((tag) => (
                <Tag key={tag} removable onRemove={() => removeTag(tag)}>
                  {tag}
                </Tag>
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3] }}>
            <View style={{ flex: 1 }}>
              <TextField
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Aggiungi un tag"
                autoCapitalize="none"
              />
            </View>
            <Button
              variant="secondary"
              onPress={addTag}
              disabled={!newTag.trim()}
              iconLeft={<PlusIcon size={18} color={t.colors.textPrimary} />}
              accessibilityLabel="Aggiungi un tag"
            >
              Aggiungi
            </Button>
          </View>
        </Field>

        {/* Nota modificabile */}
        <NoteField label="Nota" value={note} onChangeText={setNote} placeholder="Perché lo salvi? (opzionale)" />

        {/* Salva modifiche + Rigenera */}
        <View style={{ flexDirection: 'row', gap: t.space[4] }}>
          <Button onPress={saveEdits} disabled={!dirty || saving} accessibilityLabel="Salva le modifiche">
            {saving ? 'Salvataggio…' : 'Salva'}
          </Button>
          <Button
            variant="secondary"
            onPress={() => void onRegenerate()}
            disabled={regenerating}
            iconLeft={<RefreshIcon size={18} color={t.colors.textPrimary} />}
            accessibilityLabel="Rigenera con l'AI"
          >
            {regenerating ? 'Rigenero…' : 'Rigenera'}
          </Button>
        </View>

        {hasText ? (
          <Button
            variant="secondary"
            onPress={() => setSheetOpen(true)}
            accessibilityLabel={`Apri ${textLabel}`}
          >
            {isAv ? 'Apri trascrizione' : 'Apri testo'}
          </Button>
        ) : null}

        {/* Conferma in un bucket */}
        <ConfirmBucket item={item} buckets={buckets} confirming={confirming} onConfirm={onConfirm} />

        {/* Elimina */}
        <Button
          variant="destructive"
          onPress={confirmRemove}
          disabled={saving}
          iconLeft={<TrashIcon size={18} color={t.colors.danger} />}
          accessibilityLabel="Elimina l'elemento"
        >
          Elimina
        </Button>
      </ScrollView>

      {hasText && (
        <TranscriptSheet
          visible={sheetOpen}
          title={isAv ? 'Trascrizione' : 'Testo'}
          text={raw}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

interface ConfirmBucketProps {
  item: Item;
  buckets: ReturnType<typeof useItemDetail>['buckets'];
  confirming: boolean;
  onConfirm: (target: ConfirmTarget, displayName: string) => Promise<boolean>;
}

function ConfirmBucket({ item, buckets, confirming, onConfirm }: ConfirmBucketProps): JSX.Element {
  const t = useTheme();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // La proposta dell'AI: un bucket esistente (suggestedBucketId) o uno nuovo
  // da creare (suggestedBucketName), con accetta-al-volo via BucketChip.
  const suggestedExisting = item.suggestedBucketId
    ? buckets.find((b) => b.id === item.suggestedBucketId) ?? null
    : null;
  const suggestion = suggestedExisting
    ? { name: suggestedExisting.name, isNew: false, target: { kind: 'existing', bucketId: suggestedExisting.id } as ConfirmTarget }
    : item.suggestedBucketName
      ? { name: item.suggestedBucketName, isNew: true, target: { kind: 'new', name: item.suggestedBucketName } as ConfirmTarget }
      : null;

  // La lista "scegli un bucket" non ripete la proposta già mostrata sopra:
  // se l'AI ha suggerito un bucket esistente, lo escludiamo per id.
  const otherBuckets = buckets.filter((b) => b.id !== suggestedExisting?.id);

  const createNew = () => {
    if (!name.trim()) return;
    void onConfirm({ kind: 'new', name, description }, name);
  };

  return (
    <View style={{ gap: t.space[4] }}>
      <SectionTitle>Salva in un bucket</SectionTitle>
      <Text style={guideStyle(t)}>Tocca un bucket per salvarci l&apos;elemento.</Text>

      {suggestion ? (
        <View style={{ gap: t.space[3] }}>
          <Text style={metaStyle(t)}>Proposta dall&apos;AI</Text>
          <BucketChip
            name={suggestion.name}
            isNew={suggestion.isNew}
            onAccept={() => void onConfirm(suggestion.target, suggestion.name)}
          />
        </View>
      ) : null}

      {/* Scegli un altro bucket esistente (escludendo la proposta sopra) */}
      {otherBuckets.length > 0 ? (
        <View style={{ gap: t.space[3] }}>
          <Text style={metaStyle(t)}>{suggestion ? 'Oppure scegli un bucket' : 'Scegli un bucket'}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
            {otherBuckets.map((bucket) => (
              <BucketChip
                key={bucket.id}
                name={bucket.name}
                onAccept={() => void onConfirm({ kind: 'existing', bucketId: bucket.id }, bucket.name)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* Crea un nuovo bucket */}
      {creating ? (
        <View style={{ gap: t.space[4] }}>
          <TextField label="Nome del bucket" value={name} onChangeText={setName} placeholder="Es. Cucina" />
          <TextField
            label="Descrizione"
            value={description}
            onChangeText={setDescription}
            placeholder="Cosa ci va dentro?"
            hint="La descrizione aiuta l'AI a scegliere il bucket giusto."
          />
          <View style={{ flexDirection: 'row', gap: t.space[4] }}>
            <Button onPress={createNew} disabled={!name.trim() || confirming} accessibilityLabel="Crea il bucket e conferma">
              {confirming ? 'Confermo…' : 'Crea e conferma'}
            </Button>
            <Button variant="ghost" onPress={() => setCreating(false)}>
              Annulla
            </Button>
          </View>
        </View>
      ) : (
        <Button
          variant="secondary"
          onPress={() => setCreating(true)}
          iconLeft={<PlusIcon size={18} color={t.colors.textPrimary} />}
        >
          Crea un nuovo bucket
        </Button>
      )}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  const t = useTheme();
  return (
    <View>
      <Text style={[metaStyle(t), { marginBottom: t.space[3] }]}>{label}</Text>
      {children}
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }): JSX.Element {
  const t = useTheme();
  return (
    <Text
      style={{
        fontFamily: t.font.displayBold,
        fontSize: t.type.subheading.size,
        lineHeight: t.type.subheading.lh,
        color: t.colors.textPrimary,
      }}
    >
      {children}
    </Text>
  );
}

function metaStyle(t: Theme) {
  return {
    fontFamily: t.font.mono,
    fontSize: t.type.label.size,
    letterSpacing: t.type.label.size * t.type.label.tracking,
    textTransform: 'uppercase' as const,
    color: t.colors.textSecondary,
  };
}

/** Testo guida discorsivo: spiega cosa fa il tap su un bucket. */
function guideStyle(t: Theme) {
  return {
    fontFamily: t.font.display,
    fontSize: t.type.bodySm.size,
    lineHeight: t.type.bodySm.lh,
    color: t.colors.textSecondary,
  };
}

/** Etichetta della fonte: l'hostname se c'è un URL, altrimenti niente override. */
function sourceName(item: Item): string | undefined {
  if (!item.sourceUrl) return undefined;
  return hostnameOf(item.sourceUrl) ?? undefined;
}

/** Lo status di dominio mappa direttamente sul badge (senza "expiring" qui). */
function badgeStatus(status: Item['status']): BadgeStatus {
  return status;
}

/** Due liste di tag sono uguali se hanno gli stessi elementi nello stesso ordine. */
function sameTags(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((tag, i) => tag === b[i]);
}
