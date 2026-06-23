import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { AddButton, TabBar, type TabBarItem } from '@/theme/components';
import { InboxIcon, LibraryIcon, SearchIcon } from '@/theme/icons';

/**
 * Navigazione principale (brief §30): tab bar in basso Inbox · Libreria · Cerca.
 * Usa il `TabBar` del design system (barra galleggiante con pill attiva che si
 * espande) al posto di quella stock di React Navigation, più il "+" di cattura
 * che galleggia SOPRA la barra. Impostazioni si raggiunge dall'header della Inbox.
 *
 * Le `key` degli item sono i nomi delle rotte expo-router del gruppo `(tabs)`.
 */
const TAB_ITEMS: readonly TabBarItem[] = [
  { key: 'index', label: 'Inbox', Icon: InboxIcon },
  { key: 'library', label: 'Libreria', Icon: LibraryIcon },
  { key: 'search', label: 'Cerca', Icon: SearchIcon },
];

export default function TabsLayout() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Inbox' }} />
        <Tabs.Screen name="library" options={{ title: 'Libreria' }} />
        <Tabs.Screen name="search" options={{ title: 'Cerca' }} />
      </Tabs>

      {/* "+" di cattura: galleggia sopra la tab bar, in basso a destra. */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', right: t.gutter, bottom: insets.bottom + t.space[4] + t.touchMin + t.space[6] }}
      >
        <AddButton onPress={() => router.push('/add')} />
      </View>
    </View>
  );
}

/** Adatta lo stato di navigazione di expo-router al `TabBar` del design system. */
function AppTabBar({ state, navigation }: BottomTabBarProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const activeKey = state.routes[state.index]?.name ?? 'index';

  return (
    <TabBar
      items={TAB_ITEMS}
      activeKey={activeKey}
      bottomInset={insets.bottom}
      onChange={(key) => {
        const route = state.routes.find((r) => r.name === key);
        if (!route) return;
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (key !== activeKey && !event.defaultPrevented) navigation.navigate(key);
      }}
    />
  );
}
