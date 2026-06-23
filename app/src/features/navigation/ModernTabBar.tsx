/**
 * ModernTabBar — tab bar inferiore "a pillola" flottante.
 *
 * Sostituisce la barra standard di expo-router con un menu più moderno: la barra
 * è staccata dai bordi (arrotondata, con ombra), la tab attiva è evidenziata da
 * una pillola colorata con icona + etichetta, le tab inattive mostrano la sola
 * icona. È puramente presentazionale: riceve stato/descrittori/navigazione dal
 * navigator e prende TUTTO lo stile da `useTheme()` (nessun valore grezzo qui).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme';

/** Dimensione icona nella tab bar (leggermente < default 24 per equilibrio visivo). */
const ICON_SIZE = 22;

export function ModernTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps): JSX.Element {
  const t = useTheme();
  const bottomInset = Math.max(insets.bottom, t.space[3]);

  return (
    <View
      style={{
        backgroundColor: t.colors.bg,
        paddingHorizontal: t.space[5],
        paddingTop: t.space[3],
        paddingBottom: bottomInset,
      }}
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: t.colors.surface,
            borderColor: t.colors.border,
            borderRadius: t.radius.pill,
            padding: t.space[2],
            gap: t.space[2],
          },
          t.shadow.lg,
        ]}
      >
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          if (!descriptor) return null;

          const { options } = descriptor;
          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const color = focused ? t.colors.primary : t.colors.textTertiary;
          const renderIcon = options.tabBarIcon;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={[
                styles.item,
                {
                  minHeight: t.touchMin,
                  gap: t.space[2],
                  paddingHorizontal: focused ? t.space[5] : t.space[4],
                  borderRadius: t.radius.pill,
                  backgroundColor: focused ? t.colors.primarySoft : 'transparent',
                  flexGrow: focused ? 1 : 0,
                },
              ]}
            >
              {renderIcon ? renderIcon({ focused, color, size: ICON_SIZE }) : null}
              {focused ? (
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: t.font.display,
                    fontSize: t.type.label.size,
                    letterSpacing: t.type.label.tracking,
                    color,
                  }}
                >
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
