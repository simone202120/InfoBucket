import { Tabs } from 'expo-router';
import { useTheme } from '@/theme';
import { InboxIcon, LibraryIcon, SearchIcon } from '@/theme/icons';

/** Tab bar in basso: Inbox · Libreria · Cerca (brief di design). */
export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
        },
        tabBarLabelStyle: { fontFamily: t.font.display, fontSize: t.type.meta.size },
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
  );
}
