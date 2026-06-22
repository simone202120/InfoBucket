/**
 * TabBar — la navigazione in basso del design system (Inbox · Libreria · Cerca).
 *
 * Porta in React Native il componente
 * "InfoBucket Design System"/components/navigation/TabBar.jsx: una barra che si
 * **stacca** dal bordo come una pill arrotondata e ombreggiata; la tab attiva si
 * **espande** in una pill `primarySoft` mostrando la label accanto all'icona,
 * mentre le inattive restano icone silenziose. Ogni target rispetta i 44pt e
 * l'inset di sicurezza è applicato sotto la barra galleggiante.
 *
 * È presentazionale: non conosce expo-router. Il mapping rotta ↔ tab vive in
 * `app/(tabs)/_layout.tsx`.
 */
import { useEffect } from 'react';
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';
import { useReducedMotion, useTheme, type Theme } from '@/theme';
import type { IconComponent } from '@/theme/icons';

/** Durata (ms) dell'espansione della tab attiva — rispecchia il design (~.22s). */
const EXPAND_MS = 220;
/** Diametro del badge contatore e spessore del suo bordo (off-scala, dal design). */
const BADGE_SIZE = 16;
const BADGE_BORDER = 1.5;

// Android richiede l'attivazione esplicita delle animazioni di layout.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface TabBarItem {
  /** Identità stabile della tab (per il design system: la rotta). */
  key: string;
  label: string;
  Icon: IconComponent;
}

export interface TabBarProps {
  items: readonly TabBarItem[];
  /** `key` della tab attiva. */
  activeKey: string;
  onChange: (key: string) => void;
  /** Contatori opzionali per tab (es. `{ index: 3 }` per la Inbox). */
  badge?: Readonly<Record<string, number>>;
  /** Inset di sicurezza inferiore: la barra galleggia sopra di esso. */
  bottomInset?: number;
}

export function TabBar({ items, activeKey, onChange, badge, bottomInset = 0 }: TabBarProps): JSX.Element {
  const t = useTheme();
  const reduced = useReducedMotion();

  // L'espansione della tab attiva è un cambio di layout (flex/larghezza): la
  // animiamo morbidamente, saltandola se l'utente preferisce "riduci movimento".
  useEffect(() => {
    if (reduced) return;
    LayoutAnimation.configureNext(
      LayoutAnimation.create(EXPAND_MS, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity),
    );
  }, [activeKey, reduced]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space[2],
        backgroundColor: t.colors.surfaceRaised,
        borderWidth: 1,
        borderColor: t.colors.border,
        borderRadius: t.radius.pill,
        padding: t.space[2],
        marginHorizontal: t.gutter,
        marginBottom: bottomInset + t.space[4],
        ...t.shadow.lg,
      }}
    >
      {items.map((item) => (
        <TabButton
          key={item.key}
          item={item}
          active={item.key === activeKey}
          count={badge?.[item.key]}
          onPress={() => onChange(item.key)}
        />
      ))}
    </View>
  );
}

interface TabButtonProps {
  item: TabBarItem;
  active: boolean;
  count: number | undefined;
  onPress: () => void;
}

function TabButton({ item, active, count, onPress }: TabButtonProps): JSX.Element {
  const t = useTheme();
  const color = active ? t.colors.primary : t.colors.textTertiary;
  const { Icon, label } = item;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={{
        // La tab attiva si allarga per ospitare la label; le inattive restano compatte.
        flex: active ? 1 : 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.space[3],
        minHeight: t.touchMin,
        paddingHorizontal: active ? t.space[5] : t.space[4],
        borderRadius: t.radius.pill,
        backgroundColor: active ? t.colors.primarySoft : 'transparent',
      }}
    >
      <View>
        <Icon size={22} color={color} />
        {count ? <Badge count={count} t={t} /> : null}
      </View>
      {active ? (
        <Text
          numberOfLines={1}
          style={{ fontFamily: t.font.display, fontSize: t.type.body.size, color }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

function Badge({ count, t }: { count: number; t: Theme }): JSX.Element {
  return (
    <View
      style={{
        position: 'absolute',
        top: -t.space[2],
        right: -t.space[3],
        minWidth: BADGE_SIZE,
        height: BADGE_SIZE,
        paddingHorizontal: t.space[1],
        borderRadius: t.radius.pill,
        backgroundColor: t.colors.primary,
        borderWidth: BADGE_BORDER,
        borderColor: t.colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: t.font.mono, fontSize: t.type.micro.size, color: t.colors.textOnPrimary }}>
        {count}
      </Text>
    </View>
  );
}
