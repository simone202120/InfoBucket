/**
 * Toast — feedback effimero di successo (es. "Salvato in «…»"). Presentazionale:
 * non gestisce la coda né i timer (lo fa ToastProvider). Stile dal tema.
 */
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { CheckIcon } from '@/theme/icons';

export interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps): JSX.Element {
  const t = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.toast,
        { backgroundColor: t.colors.textPrimary, borderRadius: t.radius.md, gap: t.space[3] },
        t.shadow.lg,
      ]}
    >
      <View style={[styles.ok, { backgroundColor: t.colors.primary, borderRadius: t.radius.pill }]}>
        <CheckIcon size={12} color={t.colors.textOnPrimary} />
      </View>
      <Text style={{ color: t.colors.surface, fontFamily: t.font.display, fontSize: t.type.body.size }}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14 },
  ok: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
});
