import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { HapticTab } from "@/components/haptic-tab";
import { useGarden } from "@/hooks/use-garden";
import { FLOWER_COLORS, useGardenColors } from "@/hooks/use-garden-colors";

export default function TabsLayout() {
  const colors = useGardenColors();
  const { garden } = useGarden();

  // The Garden tab icon reflects growth progress: a plain leaf early on,
  // filling in to a solid flower once you've reached Full Bloom.
  const gardenIconName = !garden || garden.stage < 2 ? "leaf-outline" : garden.stage < 4 ? "flower-outline" : "flower";
  const gardenIconColor = garden ? FLOWER_COLORS[garden.flowerColor]?.swatch : undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.inputBorder,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Garden",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={gardenIconName as any} size={size} color={focused && gardenIconColor ? gardenIconColor : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}