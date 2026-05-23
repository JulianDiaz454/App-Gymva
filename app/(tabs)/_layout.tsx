import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon } from '@/components/TabIcon';
import { Text } from '@/components/Text';
import { colors, radii } from '@/theme/tokens';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(28,28,32,0.95)',
          borderTopWidth: 0,
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: insets.bottom > 0 ? insets.bottom : 12,
          height: 64,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: colors.border,
          paddingTop: 8,
          paddingBottom: 8,
          elevation: 0,
        },
        tabBarBackground: () => <View style={[StyleSheet.absoluteFill, styles.backdrop]} />,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoy',
          tabBarIcon: ({ focused }) => <TabBarItem icon="flame" label="Hoy" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progreso',
          tabBarIcon: ({ focused }) => <TabBarItem icon="chart" label="Progreso" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ focused }) => <TabBarItem icon="cal" label="Calendario" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Ejercicios',
          tabBarIcon: ({ focused }) => <TabBarItem icon="more" label="Ejercicios" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

function TabBarItem({
  icon,
  label,
  focused,
}: {
  icon: 'flame' | 'chart' | 'cal' | 'routines' | 'more';
  label: string;
  focused: boolean;
}) {
  return (
    <View
      style={[
        styles.item,
        {
          backgroundColor: focused ? colors.raised : 'transparent',
        },
      ]}
    >
      <TabIcon kind={icon} color={focused ? colors.text : colors.textMut} active={focused} />
      <Text
        variant="micro"
        tone={focused ? 'primary' : 'muted'}
        style={{ fontSize: 10.5, fontWeight: '600' }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(28,28,32,0.85)',
    borderRadius: radii.lg,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 70,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
});
