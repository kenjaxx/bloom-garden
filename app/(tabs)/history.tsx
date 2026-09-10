import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { CalendarGrid } from "@/components/calendar-grid";
import { useGarden } from "@/hooks/use-garden";
import { useGardenColors } from "@/hooks/use-garden-colors";

export default function HistoryScreen() {
  const colors = useGardenColors();
  const { loading, garden, uid } = useGarden();
  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!garden) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Create or join a garden to see your history here.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Your History</Text>
      <Text style={styles.subtitle}>Every day you and your partner showed up together</Text>
      <CalendarGrid garden={garden} uid={uid} colors={colors} />
    </ScrollView>
  );
}

function getStyles(colors: ReturnType<typeof useGardenColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      alignItems: "center",
      padding: 24,
      paddingTop: 48,
      backgroundColor: colors.background,
    },
    title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 4 },
    subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 20, textAlign: "center" },
    emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  });
}
