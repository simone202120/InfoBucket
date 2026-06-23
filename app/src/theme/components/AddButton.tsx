/**
 * AddButton — il "+" prominente per la cattura manuale. Un FAB circolare rialzato
 * nel colore primario; galleggia sopra la tab bar in basso a destra. Etichetta
 * opzionale per la variante estesa. Stile dal tema.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { PlusIcon } from '@/theme/icons';

export interface AddButtonProps {
  onPress?: () => void;
  /** Etichetta opzionale: se presente rende la variante estesa. */
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export function AddButton({ onPress, label, style }: AddButtonProps): JSX.Element {
  const theme = useTheme();
  const [pressed, setPressed] = useState(false);
  const extended = Boolean(label);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Aggiungi'}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.fab,
        {
          width: extended ? undefined : 56,
          paddingLeft: extended ? 18 : 0,
          paddingRight: extended ? 22 : 0,
          borderRadius: theme.radius.pill,
          backgroundColor: pressed ? theme.colors.primaryPress : theme.colors.primary,
        },
        theme.shadow.lg,
        style,
      ]}
    >
      <PlusIcon size={24} color={theme.colors.textOnPrimary} />
      {extended ? (
        <Text
          style={{ fontFamily: theme.font.display, fontSize: theme.type.subheading.size, color: theme.colors.textOnPrimary }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
