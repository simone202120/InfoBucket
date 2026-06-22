/**
 * Tag — chip di parola chiave. Sobrio per default (mono catalogo su riempimento
 * morbido). `removable` mostra una × per l'editing; `selected` lo evidenzia con
 * l'accento. Tutto lo stile dal tema.
 */
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { XIcon } from '@/theme/icons';

export interface TagProps {
  children: ReactNode;
  /** Mostra il pulsante × per rimuovere. */
  removable?: boolean;
  onRemove?: () => void;
  /** Evidenzia il tag come selezionato. */
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Tag({ children, removable = false, onRemove, selected = false, onPress, style }: TagProps): JSX.Element {
  const theme = useTheme();
  const fg = selected ? theme.colors.primary : theme.colors.textSecondary;
  const bg = selected ? theme.colors.primarySoft : theme.colors.bgSunken;
  const border = selected ? theme.colors.primarySoft2 : 'transparent';

  const content = (
    <>
      <Text style={[styles.hash, { color: fg }]}>#</Text>
      <Text style={[styles.label, { fontFamily: theme.font.mono, fontSize: theme.type.label.size, color: fg }]}>
        {children}
      </Text>
      {removable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove tag"
          onPress={onRemove}
          hitSlop={8}
          style={styles.remove}
        >
          <XIcon size={12} color={theme.colors.textTertiary} />
        </Pressable>
      ) : null}
    </>
  );

  const containerStyle = [
    styles.chip,
    {
      borderRadius: theme.radius.pill,
      backgroundColor: bg,
      borderColor: border,
      paddingLeft: 11,
      paddingRight: removable ? 6 : 11,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={containerStyle}>
        {content}
      </Pressable>
    );
  }
  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  hash: { opacity: 0.55, fontSize: 12 },
  label: { letterSpacing: 0.1 },
  remove: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 1 },
});
