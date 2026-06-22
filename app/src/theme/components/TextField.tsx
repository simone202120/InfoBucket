/**
 * TextField — input testo etichettato a riga singola (nome bucket, URL manuale).
 * Etichetta in mono catalogo; bordo di focus chiaro per l'accessibilità.
 * Stile dal tema.
 */
import { useState, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme';

export interface TextFieldProps {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  /** Testo d'aiuto sotto il campo. */
  hint?: string;
  /** Messaggio d'errore: sostituisce l'hint e colora il bordo di danger. */
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  iconLeft?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  iconLeft,
  style,
}: TextFieldProps): JSX.Element {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? theme.colors.danger : focused ? theme.colors.primary : theme.colors.borderStrong;

  return (
    <View style={style}>
      {label ? (
        <Text
          style={{
            marginBottom: 7,
            fontFamily: theme.font.mono,
            fontSize: theme.type.label.size,
            letterSpacing: theme.type.label.size * theme.type.label.tracking,
            textTransform: 'uppercase',
            color: theme.colors.textSecondary,
          }}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderColor,
            borderRadius: theme.radius.sm,
            minHeight: theme.touchMin,
          },
          focused ? { borderColor, borderWidth: 1.5 } : null,
        ]}
      >
        {iconLeft ? <View style={styles.icon}>{iconLeft}</View> : null}
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          style={[
            styles.input,
            { fontFamily: theme.font.display, fontSize: theme.type.body.size, color: theme.colors.textPrimary },
          ]}
        />
      </View>
      {error || hint ? (
        <Text
          style={{
            marginTop: 6,
            fontFamily: theme.font.display,
            fontSize: theme.type.bodySm.size,
            color: error ? theme.colors.danger : theme.colors.textTertiary,
          }}
        >
          {error ?? hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  icon: { alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minWidth: 0, paddingVertical: 12 },
});
