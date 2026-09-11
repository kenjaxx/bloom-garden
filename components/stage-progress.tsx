import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useEffect } from "react";

import { STAGE_NAMES } from "@/hooks/use-garden";
import type { GardenColors } from "@/hooks/use-garden-colors";

type Props = {
  stage: number;
  accentColor: string;
  colors: GardenColors;
};

export function StageProgress({ stage, accentColor, colors }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(stage / (STAGE_NAMES.length - 1), { duration: 700 });
  }, [stage, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: colors.pillBackground }]}>
        <Animated.View style={[styles.fill, fillStyle, { backgroundColor: accentColor }]} />
      </View>
      <View style={styles.labelRow}>
        {STAGE_NAMES.map((name, i) => (
          <Text
            key={name}
            style={[
              styles.label,
              { color: i <= stage ? accentColor : colors.textFaint },
              i === stage && styles.labelActive,
            ]}
            numberOfLines={1}
          >
            {name}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  label: { fontSize: 9, fontWeight: "600", flex: 1, textAlign: "center" },
  labelActive: { fontWeight: "800" },
});
