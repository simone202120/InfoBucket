/**
 * Button — il controllo d'azione primario. L'etichetta è lo stesso nome usato
 * in tutto il flusso (Salva, non Invia). Tutto lo stile arriva da `useTheme()`.
 */
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, type Theme } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: ReactNode;
  /** Peso visivo. @default "primary" */
  variant?: ButtonVariant;
  /** @default "md" */
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** Si estende a tutta la larghezza del contenitore (CTA primari mobile). */
  fullWidth?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

interface SizeSpec {
  paddingH: number;
  height: number;
  fontSize: number;
  radius: number;
  gap: number;
}

function sizeSpec(theme: Theme, size: ButtonSize): SizeSpec {
  switch (size) {
    case 'sm':
      return { paddingH: theme.space[4], height: 34, fontSize: theme.type.bodySm.size, radius: theme.radius.sm, gap: theme.space[3] };
    case 'lg':
      return { paddingH: theme.space[6], height: 52, fontSize: theme.type.subheading.size, radius: theme.radius.md, gap: theme.space[3] };
    case 'md':
    default:
      return { paddingH: theme.space[5], height: theme.touchMin, fontSize: theme.type.body.size, radius: theme.radius.md, gap: theme.space[3] };
  }
}

interface VariantSpec {
  bg: string;
  fg: string;
  border: string;
  pressedBg: string;
}

function variantSpec(theme: Theme, variant: ButtonVariant): VariantSpec {
  const c = theme.colors;
  switch (variant) {
    case 'secondary':
      return { bg: c.surface, fg: c.textPrimary, border: c.borderStrong, pressedBg: c.surfaceHover };
    case 'ghost':
      return { bg: 'transparent', fg: c.primary, border: 'transparent', pressedBg: c.primarySoft };
    case 'destructive':
      return { bg: c.dangerSoft, fg: c.danger, border: 'transparent', pressedBg: c.danger + '22' };
    case 'primary':
    default:
      return { bg: c.primary, fg: c.textOnPrimary, border: 'transparent', pressedBg: c.primaryPress };
  }
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled = false,
  onPress,
  accessibilityLabel,
}: ButtonProps): JSX.Element {
  const theme = useTheme();
  const [pressed, setPressed] = useState(false);
  const s = sizeSpec(theme, size);
  const v = variantSpec(theme, variant);
  const showShadow = variant === 'primary' && !disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        {
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          gap: s.gap,
          height: s.height,
          minHeight: theme.touchMin,
          paddingHorizontal: s.paddingH,
          borderRadius: s.radius,
          borderColor: v.border,
          backgroundColor: pressed && !disabled ? v.pressedBg : v.bg,
          opacity: disabled ? 0.45 : 1,
        },
        showShadow && theme.shadow.sm,
      ]}
    >
      {iconLeft ? <View style={styles.icon}>{iconLeft}</View> : null}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: theme.font.display,
          fontSize: s.fontSize,
          color: v.fg,
        }}
      >
        {children}
      </Text>
      {iconRight ? <View style={styles.icon}>{iconRight}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  icon: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
});
