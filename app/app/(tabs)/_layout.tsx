import { Tabs, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { AddButton } from '@/theme/components';
import { InboxIcon, LibraryIcon, SearchIcon } from '@/theme/icons';

/**
 * Navigazione principale (brief §30): tab bar in basso Inbox · Libreria · Cerca,
 * con il "+" di cattura manuale che galleggia SOPRA la tab bar (design system:
 * `TabBar` + `AddButton`). Il "+" è globale qui — così compare su ogni tab — e non
 * più duplicato nelle singole schermate. Impostazioni si raggiungono dall'header.
 */
export default function TabsLayout() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: t.colors.primary,
          tabBarInactiveTintColor: t.colors.textTertiary,
          tabBarStyle: {
            backgroundColor: t.colors.surface,
            borderTopColor: t.colors.border,
            borderTopWidth: 1,
            height: t.touchMin + insets.bottom + t.space[4],
            paddingTop: t.space[2],
          },
          tabBarLabelStyle: {
            fontFamily: t.font.display,
            fontSize: t.type.meta.size,
          },
          tabBarItemStyle: { paddingVertical: t.space[1] },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Inbox', tabBarIcon: ({ color, size }) => <InboxIcon color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="library"
          options={{ title: 'Libreria', tabBarIcon: ({ color, size }) => <LibraryIcon color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="search"
          options={{ title: 'Cerca', tabBarIcon: ({ color, size }) => <SearchIcon color={color} size={size} /> }}
        />
      </Tabs>

      {/* "+" di cattura: galleggia sopra la tab bar, in basso a destra (design system). */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: t.gutter,
          bottom: t.touchMin + insets.bottom + t.space[5],
        }}
      >
        <AddButton onPress={() => router.push('/add')} />
      </View>
    </View>
  );
}
