/**
 * BucketChip — la destinazione proposta dall'AI con "accetta al volo". Una
 * scintilla la segnala come suggerimento; il controllo finale accetta (✓) in un
 * tap, oppure crea (+) quando la proposta è un bucket nuovo. `confirmed` mostra
 * lo stato confermato dall'utente (niente scintilla, pieno).
 */
import { StyleSheet, Text, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { haptics } from '@/theme/haptics';
import { CheckIcon, PlusIcon, SparkleIcon } from '@/theme/icons';

export interface BucketChipProps {
  name: string;
  /** La proposta è un bucket nuovo da creare. */
  isNew?: boolean;
  /** Stato confermato dall'utente. */
  confirmed?: boolean;
  /** Accetta (o crea) il bucket in un tap. */
  onAccept?: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function BucketChip({ name, isNew = false, confirmed = false, onAccept, onPress, style }: BucketChipProps): JSX.Element {
  const theme = useTheme();
  const labelColor = confirmed ? theme.colors.primary : theme.colors.textPrimary;
  const acceptLabel = isNew ? `Create ${name}` : `Accept ${name}`;
  const showPlus = isNew && !confirmed;
  const acceptFg = confirmed ? theme.colors.primary : theme.colors.textOnPrimary;
  const acceptBg = confirmed ? 'transparent' : theme.colors.primary;

  const containerStyle = [
    styles.chip,
    {
      borderRadius: theme.radius.pill,
      backgroundColor: confirmed ? theme.colors.primarySoft : theme.colors.surface,
      borderColor: confirmed ? theme.colors.primarySoft2 : theme.colors.borderStrong,
    },
    style,
  ];

  const inner = (
    <>
      {!confirmed ? <SparkleIcon size={14} color={theme.colors.primary} /> : null}
      <Text
        numberOfLines={1}
        style={{ fontFamily: theme.font.display, fontSize: theme.type.bodySm.size, color: labelColor }}
      >
        {showPlus ? `New · ${name}` : name}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={acceptLabel}
        onPress={onAccept ? () => { haptics.light(); onAccept(); } : undefined}
        hitSlop={8}
        style={[styles.accept, { backgroundColor: acceptBg }]}
      >
        {showPlus ? <PlusIcon size={15} color={acceptFg} /> : <CheckIcon size={15} color={acceptFg} />}
      </Pressable>
    </>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={containerStyle}>
        {inner}
      </Pressable>
    );
  }
  return <View style={containerStyle}>{inner}</View>;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingLeft: 12,
    paddingRight: 5,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  accept: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
