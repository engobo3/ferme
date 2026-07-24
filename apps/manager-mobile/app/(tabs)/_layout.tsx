import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { colors, t } from '@diaspora-trust/shared-ui';
import { HapticTab } from '@/components/haptic-tab';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color }) => <Ionicons size={26} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="materials"
        options={{
          title: t('nav.site'),
          tabBarIcon: ({ color }) => <Ionicons size={26} name="business" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: t('nav.tools'),
          tabBarIcon: ({ color }) => <Ionicons size={26} name="construct" color={color} />,
        }}
      />
    </Tabs>
  );
}
