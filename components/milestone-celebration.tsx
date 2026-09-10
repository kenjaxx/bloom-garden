import { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import type { Milestone } from "@/hooks/use-garden";

const { width } = Dimensions.get("window");
const PARTICLES = "🌸🌼🎉✨💚🌷".split("");

type Props = {
  milestone: Milestone;
  onDone: () => void;
};

function Particle({ index, onLastDone }: { index: number; onLastDone?: () => void }) {
  const progress = useSharedValue(0);
  const startX = useMemo(() => Math.random() * width, []);
  const drift = useMemo(() => (Math.random() - 0.5) * 120, []);
  const delay = useMemo(() => Math.random() * 300, []);
  const symbol = PARTICLES[index % PARTICLES.length];

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(
        1,
        { duration: 1400 + Math.random() * 500, easing: Easing.out(Easing.quad) },
        (finished) => {
          if (finished && onLastDone) runOnJS(onLastDone)();
        }
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute",
    left: startX,
    top: -20,
    opacity: 1 - progress.value,
    transform: [
      { translateY: progress.value * 420 },
      { translateX: progress.value * drift },
      { rotate: `${progress.value * 180}deg` },
      { scale: 0.8 + progress.value * 0.6 },
    ],
  }));

  return (
    <Animated.Text style={[style, styles.particle]}>{symbol}</Animated.Text>
  );
}

export function MilestoneCelebration({ milestone, onDone }: Props) {
  if (!milestone) return null;

  const label =
    milestone.type === "stage"
      ? `You reached ${milestone.label}! 🎉`
      : `${milestone.value}-day streak! 🔥`;

  return (
    <Animated.View pointerEvents="none" style={styles.overlay}>
      {Array.from({ length: 18 }).map((_, i) => (
        <Particle key={i} index={i} onLastDone={i === 17 ? onDone : undefined} />
      ))}
      <Animated.View style={styles.banner}>
        <Text style={styles.bannerText}>{label}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: "center",
  },
  particle: {
    fontSize: 28,
  },
  banner: {
    marginTop: 60,
    backgroundColor: "rgba(34,57,42,0.9)",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  bannerText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});
