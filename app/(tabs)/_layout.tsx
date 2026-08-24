import { Tabs } from "expo-router";
import React from "react";
import { Dumbbell, LayoutGrid, Settings } from "lucide-react-native";
import { colors } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: { fontFamily: "Archivo-Medium" },
      }}
    >
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) => <LayoutGrid size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Routines",
          tabBarIcon: ({ color }) => <Dumbbell size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
