import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

import type { GardenColors } from "@/hooks/use-garden-colors";

type Props = {
  message: string | null;
  colors: GardenColors;
};

export function Toast({ message, colors }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: message ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [message, opacity]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { backgroundColor: colors.errorBackground, opacity }]}
    >
      <Text style={[styles.text, { color: colors.errorText }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 12,
    left: 24,
    right: 24,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    zIndex: 60,
  },
  text: { fontSize: 13, fontWeight: "600", textAlign: "center" },
});