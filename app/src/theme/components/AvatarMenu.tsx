/**
 * AvatarMenu — pastiglia con le iniziali dell'email in alto a destra negli header.
 * Al tap apre un menu con Impostazioni ed Esci. Sostituisce l'accesso alle
 * Impostazioni via ingranaggio, rendendolo disponibile in ogni schermata.
 */
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

export interface AvatarMenuProps {
  email: string | null;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

/** Iniziali (max 2) dall'email: prima lettera dei primi due segmenti alfanumerici. */
function initialsOf(email: string | null): string {
  if (!email) return '·';
  const parts = email.split('@')[0]?.split(/[.\-_]+/).filter(Boolean) ?? [];
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
  return letters || email[0]?.toUpperCase() || '·';
}

export function AvatarMenu({ email, onOpenSettings, onSignOut }: AvatarMenuProps): JSX.Element {
  const t = useTheme();
  const [open, setOpen] = useState(false);

  const choose = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Apri il menu account"
        style={{ width: t.touchMin, height: t.touchMin, alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={{ width: 34, height: 34, borderRadius: t.radius.pill, backgroundColor: t.colors.primarySoft, borderWidth: 1, borderColor: t.colors.primarySoft2, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: t.font.displayBold, fontSize: t.type.bodySm.size, color: t.colors.primaryPress }}>
            {initialsOf(email)}
          </Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: t.colors.scrim + '33' }]} onPress={() => setOpen(false)} accessibilityLabel="Chiudi il menu">
          <View style={[styles.sheet, { backgroundColor: t.colors.surfaceRaised, borderRadius: t.radius.lg, borderColor: t.colors.border }, t.shadow.lg]}>
            <MenuRow label="Impostazioni" onPress={() => choose(onOpenSettings)} color={t.colors.textPrimary} font={t.font.display} size={t.type.subheading.size} minH={t.touchMin} />
            <View style={{ height: 1, backgroundColor: t.colors.border }} />
            <MenuRow label="Esci" onPress={() => choose(onSignOut)} color={t.colors.danger} font={t.font.display} size={t.type.subheading.size} minH={t.touchMin} />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function MenuRow(props: { label: string; onPress: () => void; color: string; font: string; size: number; minH: number }): JSX.Element {
  return (
    <Pressable onPress={props.onPress} accessibilityRole="button" accessibilityLabel={props.label} style={{ minHeight: props.minH, justifyContent: 'center', paddingHorizontal: 16 }}>
      <Text style={{ fontFamily: props.font, fontSize: props.size, color: props.color }}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 64, paddingRight: 16 },
  sheet: { minWidth: 200, borderWidth: 1, overflow: 'hidden' },
});
