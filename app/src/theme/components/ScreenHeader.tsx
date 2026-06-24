/**
 * ScreenHeader — l'header editoriale condiviso: occhiello mono opzionale,
 * titolo grande (Bricolage display) e uno slot azioni a destra (es. AvatarMenu).
 * Stile dal tema.
 */
import { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';

export interface ScreenHeaderProps {
  kicker?: string;
  title: string;
  right?: ReactNode;
}

export function ScreenHeader({ kicker, title, right }: ScreenHeaderProps): JSX.Element {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: t.gutter, paddingTop: t.space[4], paddingBottom: t.space[3] }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        {kicker ? (
          <Text style={{ fontFamily: t.font.mono, fontSize: t.type.meta.size, letterSpacing: t.type.meta.size * t.type.meta.tracking, textTransform: 'uppercase', color: t.colors.textTertiary, marginBottom: t.space[2] }}>
            {kicker}
          </Text>
        ) : null}
        <Text style={{ fontFamily: t.font.displayBold, fontSize: t.type.display.size, lineHeight: t.type.display.lh, color: t.colors.textPrimary }}>
          {title}
        </Text>
      </View>
      {right ? <View style={{ marginLeft: t.space[3] }}>{right}</View> : null}
    </View>
  );
}
