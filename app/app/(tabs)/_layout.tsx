import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion, useTheme, type Theme } from '@/theme';
import { AddButton } from '@/theme/components';
import { InboxIcon, LibraryIcon, SearchIcon, type IconComponent } from '@/theme/icons';

/**
 * Navigazione principale (brief §30): tab bar in basso Inbox · Libreria · Cerca
 * con una **tab bar personalizzata** (non quella stock di React Navigation) — la
 * tab attiva ha una "pill" colorata che entra con una animazione breve — e il "+"
 * di cattura che galleggia SOPRA la barra (design system: `TabBar` + `AddButton`).
 * Impostazioni si raggiungono dall'header della Inbox.
 */
const TAB_META: Record<string, { label: string; Icon: IconComponent }> = {
  index: { label: 'Inbox', Icon: InboxIcon },
  library: { label: 'Libreria', Icon: LibraryIcon },
  search: { label: 'Cerca', Icon: SearchIcon },
};

export default function TabsLayout() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Inbox' }} />
        <Tabs.Screen name="library" options={{ title: 'Libreria' }} />
        <Tabs.Screen name="search" options={{ title: 'Cerca' }} />
      </Tabs>

      {/* "+" di cattura: galleggia sopra la tab bar, in basso a destra. */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', right: t.gutter, bottom: insets.bottom + t.touchMin + t.space[6] }}
      >
        <AddButton onPress={() => router.push('/add')} />
      </View>
    </View>
  );
}

/** Tab bar del design system: barra in superficie con bordo superiore e pill attiva. */
function FloatingTabBar({ state, navigation }: BottomTabBarProps): JSX.Element {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: t.colors.surface,
        borderTopWidth: 1,
        borderTopColor: t.colors.border,
        paddingTop: t.space[3],
        paddingBottom: insets.bottom + t.space[3],
        paddingHorizontal: t.space[3],
      }}
    >
      {state.routes.map((route, index) => {
        const meta = TAB_META[route.name];
        if (!meta) return null;
        const focused = state.index === index;
        return (
          <TabItem
            key={route.key}
            meta={meta}
            focused={focused}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
          />
        );
      })}
    </View>
  );
}

interface TabItemProps {
  meta: { label: string; Icon: IconComponent };
  focused: boolean;
  onPress: () => void;
}

function TabItem({ meta, focused, onPress }: TabItemProps): JSX.Element {
  const t = useTheme();
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(focused ? 1 : 0);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: focused ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [focused, reduced, progress]);

  const color = focused ? t.colors.primary : t.colors.textTertiary;
  const { Icon, label } = meta;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: t.touchMin }}
    >
      <View style={pillWrap(t)}>
        {/* Pill colorata che entra dietro la tab attiva (scala + opacità). */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: t.colors.primarySoft,
            borderRadius: t.radius.pill,
            opacity: progress,
            transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
          }}
        />
        <Icon color={color} size={22} />
        <Text style={{ fontFamily: t.font.display, fontSize: t.type.meta.size, color }}>{label}</Text>
      </View>
    </Pressable>
  );
}

function pillWrap(t: Theme) {
  return {
    alignItems: 'center' as const,
    gap: t.space[1],
    paddingHorizontal: t.space[5],
    paddingVertical: t.space[2],
    borderRadius: t.radius.pill,
  };
}
