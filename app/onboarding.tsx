import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const PAGES = [
  {
    emoji: "🌱",
    title: "Grow a garden together",
    body: "Create a garden and invite your partner with a 6-character code. Every day you both check in, your garden grows.",
  },
  {
    emoji: "🔥",
    title: "Build a streak",
    body: "Check in together on consecutive days to build a streak. Miss a day and it resets — unless you've banked a streak freeze!",
  },
  {
    emoji: "💬",
    title: "Leave a little note",
    body: "Attach a short note to your check-in so your partner sees a little hello from you when they open the app.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const goToTabs = () => router.replace("/(tabs)");

  const handleNext = () => {
    if (index === PAGES.length - 1) {
      goToTabs();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={goToTabs}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {PAGES.map((page, i) => (
          <View key={i} style={styles.page}>
            <Text style={styles.emoji}>{page.emoji}</Text>
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.body}>{page.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {PAGES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.85}>
        <Text style={styles.buttonText}>{index === PAGES.length - 1 ? "Get Started" : "Next"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef5ee" },
  skip: { position: "absolute", top: 56, right: 24, zIndex: 10 },
  skipText: { color: "#6f8272", fontSize: 14, fontWeight: "600" },
  page: { width, alignItems: "center", justifyContent: "center", padding: 32 },
  emoji: { fontSize: 72, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "800", color: "#22392a", textAlign: "center", marginBottom: 12 },
  body: { fontSize: 15, color: "#6f8272", textAlign: "center", lineHeight: 22, maxWidth: 320 },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#c8ddc9" },
  dotActive: { backgroundColor: "#4caf50", width: 20 },
  button: {
    backgroundColor: "#4caf50",
    marginHorizontal: 32,
    marginBottom: 48,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});