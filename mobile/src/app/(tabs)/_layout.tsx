import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutGrid, Paintbrush, Settings } from 'lucide-react-native';
import { useTheme } from '@/lib/theme/ThemeContext';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.desk,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
        },
        tabBarActiveTintColor: theme.brandGreen,
        tabBarInactiveTintColor: theme.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Desk',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <LayoutGrid size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="studio"
        options={{
          title: 'Studio',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Paintbrush size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
