import type { PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import type { GardenColors } from "@/hooks/use-garden-colors";

type ScreenStateProps = PropsWithChildren<{
  colors: GardenColors;
  loading?: boolean;
  emptyText?: string;
}>;

/**
 * Wraps a screen's gradient background + centers an ActivityIndicator while
 * loading, or an empty-state message when `emptyText` is set, falling back
 * to rendering `children` normally otherwise. Pulled out of index.tsx and
 * history.tsx since both screens repeated this exact loading/empty shell.
 */
export function ScreenState({ colors, loading, emptyText, children }: ScreenStateProps) {
  const styles = getStyles(colors);

  if (loading) {
    return (
      <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={styles.flexFill}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </LinearGradient>
    );
  }

  if (emptyText) {
    return (
      <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={styles.flexFill}>
        <View style={styles.container}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      </LinearGradient>
    );
  }

  return <>{children}</>;
}

function getStyles(colors: GardenColors) {
  return StyleSheet.create({
    flexFill: { flex: 1 },
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: "center",
      paddingHorizontal: 32,
    },
  });
}