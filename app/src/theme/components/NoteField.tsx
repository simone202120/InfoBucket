/**
 * NoteField — campo nota multilinea con affordance di dettatura. Il mic sta in
 * basso a destra: NON è una STT custom, è solo l'invito a usare la dettatura
 * della tastiera di sistema (basta un TextInput multiline). `recording` lo mostra
 * attivo. La nota si legge in Newsreader, come il summary accanto a cui sta.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { MicIcon } from '@/theme/icons';

export interface NoteFieldProps {
  /** @default "Note" */
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  /** Stato di dettatura attiva (mic evidenziato). */
  recording?: boolean;
  /** Tap sul mic: il consumer apre/chiude la dettatura di sistema. */
  onDictate?: () => void;
  /** @default 3 */
  rows?: number;
  style?: StyleProp<ViewStyle>;
}

export function NoteField({
  label = 'Note',
  value,
  onChangeText,
  placeholder = 'Add a note, or dictate one…',
  recording = false,
  onDictate,
  rows = 3,
  style,
}: NoteFieldProps): JSX.Element {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

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
          styles.box,
          {
            backgroundColor: theme.colors.surface,
            borderColor: focused ? theme.colors.primary : theme.colors.borderStrong,
            borderRadius: theme.radius.sm,
          },
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          numberOfLines={rows}
          textAlignVertical="top"
          style={[
            styles.input,
            {
              minHeight: rows * theme.type.readSm.lh,
              fontFamily: theme.font.read,
              fontSize: theme.type.readSm.size,
              lineHeight: theme.type.readSm.lh,
              color: theme.colors.textPrimary,
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={recording ? 'Stop dictation' : 'Dictate note'}
          accessibilityState={{ selected: recording }}
          onPress={onDictate}
          hitSlop={6}
          style={[
            styles.mic,
            {
              backgroundColor: recording ? theme.colors.primary : theme.colors.primarySoft,
            },
          ]}
        >
          <MicIcon size={17} color={recording ? theme.colors.textOnPrimary : theme.colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'relative', padding: 12, borderWidth: 1.5 },
  input: { paddingRight: 36 },
  mic: { position: 'absolute', right: 8, bottom: 8, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
