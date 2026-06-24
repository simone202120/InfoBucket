/**
 * AccentPicker — scelta di un colore d'accento personalizzato senza dipendenze
 * esterne: una riga di tinte rapide + un campo esadecimale con anteprima.
 * Valida `#RGB`/`#RRGGBB` e chiama onChange solo su valore valido.
 */
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTheme } from '@/theme';

const QUICK = ['#2D5AD9', '#10A37F', '#E5731F', '#C0344D', '#7C5CC4', '#0E7C86'] as const;
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export interface AccentPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function AccentPicker({ value, onChange }: AccentPickerProps): JSX.Element {
  const t = useTheme();
  const [text, setText] = useState(value);

  const commit = (next: string) => {
    setText(next);
    if (HEX.test(next.trim())) onChange(next.trim());
  };

  return (
    <View style={{ gap: t.space[4] }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
        {QUICK.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`Tinta ${c}`}
            onPress={() => commit(c)}
            style={{ width: t.touchMin, height: t.touchMin, alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={{ width: 26, height: 26, borderRadius: t.radius.pill, backgroundColor: c, borderWidth: 1.5, borderColor: t.colors.border }} />
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
        <View style={{ width: 26, height: 26, borderRadius: t.radius.sm, backgroundColor: HEX.test(text.trim()) ? text.trim() : t.colors.surfaceHover, borderWidth: 1, borderColor: t.colors.border }} />
        <TextInput
          accessibilityLabel="Colore esadecimale"
          value={text}
          onChangeText={commit}
          placeholder="#2D5AD9"
          placeholderTextColor={t.colors.textTertiary}
          autoCapitalize="characters"
          style={{ flex: 1, minHeight: t.touchMin, fontFamily: t.font.mono, fontSize: t.type.body.size, color: t.colors.textPrimary, borderWidth: 1.5, borderColor: t.colors.borderStrong, borderRadius: t.radius.sm, paddingHorizontal: t.space[4] }}
        />
      </View>
    </View>
  );
}
