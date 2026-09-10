import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { FLOWER_COLORS, FlowerColorKey } from "@/hooks/use-garden-colors";

type Props = {
  stage: number;
  flowerColor: FlowerColorKey;
  size?: number;
};

/**
 * Renders the current growth stage as an animated emoji "sprite".
 * This intentionally avoids any external Lottie asset (the bundled
 * assets/animations/flower.json was an empty stub) so it works
 * identically on iOS, Android, and web with zero extra assets.
 */
export function FlowerStage({ stage, flowerColor, size = 220 }: Props) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const sway = useSharedValue(0);

  const emoji = FLOWER_COLORS[flowerColor]?.emoji ?? FLOWER_COLORS.pink.emoji;
  const symbol = emoji[Math.min(stage, emoji.length - 1)];

  // Pop animation whenever the stage changes.
  useEffect(() => {
    scale.value = withSequence(
      withTiming(0.75, { duration: 120 }),
      withSpring(1.15, { damping: 6 }),
      withSpring(1)
    );
    rotate.value = withSequence(
      withTiming(-8, { duration: 100 }),
      withTiming(8, { duration: 150 }),
      withTiming(0, { duration: 150 })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, flowerColor]);

  // Gentle idle sway so the "plant" always feels alive.
  useEffect(() => {
    const loop = () => {
      sway.value = withSequence(
        withTiming(1, { duration: 1600 }),
        withTiming(-1, { duration: 1600 })
      );
    };
    loop();
    const interval = setInterval(loop, 3200);
    return () => clearInterval(interval);
  }, [sway]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value + sway.value * 2}deg` },
    ],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.Text style={[{ fontSize: size * 0.4 }, animatedStyle]}>{symbol}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});
