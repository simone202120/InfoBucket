import { Tabs } from 'expo-router';
import { ModernTabBar } from '@/features/navigation/ModernTabBar';
import { InboxIcon, LibraryIcon, SearchIcon } from '@/theme/icons';

/** Tab bar in basso "a pillola" (ModernTabBar): Inbox · Libreria · Cerca. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ModernTabBar {...props} />}
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
