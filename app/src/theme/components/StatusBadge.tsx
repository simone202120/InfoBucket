/**
 * StatusBadge — il secondo segnale strutturale: dov'è un elemento nel suo ciclo
 * di vita. Pillola con un pallino di stato. Passa `children` per sovrascrivere
 * l'etichetta (es. un countdown per "expiring"). Colori fissi dallo status del
 * tema (non seguono l'accento utente).
 */
import { type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

/**
 * Stato mostrato dal badge. Estende `ItemStatus` di dominio con "expiring", che
 * è un segnale puramente visivo (decadimento imminente), non un valore SQL.
 */
export type BadgeStatus = 'processing' | 'ready' | 'saved' | 'archived' | 'expiring';

export interface StatusBadgeProps {
  /** @default "ready" */
  status?: BadgeStatus;
  /** Sovrascrive l'etichetta di default (es. "Tra 3 giorni"). */
  children?: ReactNode;
  /** Mostra il pallino di stato. @default true */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}

const LABEL: Record<BadgeStatus, string> = {
  processing: 'In lavorazione',
  ready: 'Pronto',
  saved: 'Salvato',
  archived: 'Archiviato',
  expiring: 'In scadenza',
};

export function StatusBadge({ status = 'ready', children, dot = true, style }: StatusBadgeProps): JSX.Element {
  const theme = useTheme();
  const fg = theme.colors.status[status];
  const bg = theme.colors.status[`${status}Soft` as const];

  return (
    <View
      accessibilityRole="text"
      style={[styles.pill, { borderRadius: theme.radius.pill, backgroundColor: bg }, style]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: fg }]} /> : null}
      <Text
        style={{
          fontFamily: theme.font.mono,
          fontSize: theme.type.micro.size,
          letterSpacing: theme.type.micro.size * theme.type.micro.tracking,
          textTransform: 'uppercase',
          color: fg,
        }}
      >
        {children ?? LABEL[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 10,
    alignSelf: 'flex-start',
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});
