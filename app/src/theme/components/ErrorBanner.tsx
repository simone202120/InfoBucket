/**
 * ErrorBanner — direzione, non umore. Dice in chiaro cosa è fallito e cosa fare,
 * con un solo "riprova". Riempimento danger morbido, mai un allarme a tutto
 * schermo. Stile dal tema.
 */
import { StyleSheet, Text, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { AlertIcon, XIcon } from '@/theme/icons';

export interface ErrorBannerProps {
  /** @default "Couldn't reach that link." */
  message?: string;
  /** Etichetta dell'azione di ripristino. @default "Try again" */
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ErrorBanner({
  message = "Couldn't reach that link.",
  actionLabel = 'Try again',
  onAction,
  onDismiss,
  style,
}: ErrorBannerProps): JSX.Element {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.banner,
        { backgroundColor: theme.colors.dangerSoft, borderRadius: theme.radius.md },
        style,
      ]}
    >
      <AlertIcon size={19} color={theme.colors.danger} />
      <Text
        style={{
          flex: 1,
          fontFamily: theme.font.display,
          fontSize: theme.type.body.size,
          lineHeight: theme.type.body.lh,
          color: theme.colors.textPrimary,
        }}
      >
        {message}
      </Text>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          hitSlop={6}
          style={[styles.action, { borderRadius: theme.radius.xs }]}
        >
          <Text style={{ fontFamily: theme.font.display, fontSize: theme.type.bodySm.size, color: theme.colors.danger }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={onDismiss}
          hitSlop={6}
          style={styles.dismiss}
        >
          <XIcon size={14} color={theme.colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
  },
  action: { paddingVertical: 6, paddingHorizontal: 8 },
  dismiss: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
