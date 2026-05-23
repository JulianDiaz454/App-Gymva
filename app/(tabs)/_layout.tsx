import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon } from '@/components/TabIcon';
import { Text } from '@/components/Text';
import { colors, radii } from '@/theme/tokens';

type TabKey = 'index' | 'progress' | 'calendar' | 'exercises';

const TAB_META: Record<TabKey, { label: string; icon: 'flame' | 'chart' | 'cal' | 'more' }> = {
  index: { label: 'Hoy', icon: 'flame' },
  progress: { label: 'Progreso', icon: 'chart' },
  calendar: { label: 'Calendario', icon: 'cal' },
  exercises: { label: 'Ejercicios', icon: 'more' },
};

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hoy' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progreso' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendario' }} />
      <Tabs.Screen name="exercises" options={{ title: 'Ejercicios' }} />
    </Tabs>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingBottom: insets.bottom > 0 ? insets.bottom + 6 : 14 },
      ]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = TAB_META[route.name as TabKey];
          if (!meta) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params as never);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              style={({ pressed }) => [
                styles.item,
                { backgroundColor: focused ? colors.raised : 'transparent' },
                pressed && { opacity: 0.75 },
              ]}
            >
              <TabIcon
                kind={meta.icon}
                color={focused ? colors.text : colors.textMut}
                active={focused}
                size={22}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  { color: focused ? colors.text : colors.textMut },
                ]}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(28,28,32,0.96)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 6,
    gap: 4,
    // sombra ligera para despegar visualmente sobre fondos claros del contenido
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 4,
    borderRadius: radii.md,
    minHeight: 58,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
