/**
 * EmptyState — il vuoto come direzione, non umore. Un glifo sobrio, un titolo in
 * Bricolage, una riga di cosa-fare in Newsreader e al massimo un'azione. Passa
 * `icon` (un nodo) per adattarlo al contesto (inbox a posto, ricerca vuota…).
 */
import { type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  body?: string;
  /** Etichetta dell'unica azione (es. "Add a link"). */
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ icon, title, body, actionLabel, onAction, style }: EmptyStateProps): JSX.Element {
  const theme = useTheme();
  return (
    <View style={[styles.container, style]}>
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            { borderRadius: theme.radius.lg, backgroundColor: theme.colors.primarySoft },
          ]}
        >
          {icon}
        </View>
      ) : null}
      {title ? (
        <Text
          style={{
            fontFamily: theme.font.displayBold,
            fontSize: theme.type.title.size,
            lineHeight: theme.type.title.lh,
            color: theme.colors.textPrimary,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
      ) : null}
      {body ? (
        <Text
          style={{
            marginTop: 8,
            fontFamily: theme.font.read,
            fontSize: theme.type.read.size,
            lineHeight: theme.type.read.lh,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          }}
        >
          {body}
        </Text>
      ) : null}
      {actionLabel ? (
        <View style={styles.action}>
          <Button variant="primary" onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 28, maxWidth: 320, alignSelf: 'center' },
  iconWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  action: { marginTop: 22 },
});
