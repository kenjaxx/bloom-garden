import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Garden } from "@/hooks/use-garden";
import type { GardenColors } from "@/hooks/use-garden-colors";

type Props = {
  garden: Garden;
  uid: string;
  colors: GardenColors;
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

export function WeeklyRecap({ garden, uid, colors }: Props) {
  const partnerId = garden.members.find((m) => m !== uid);

  const { bloomed, elapsed } = useMemo(() => {
    const start = startOfWeek(new Date());
    const now = new Date();
    let bloomedCount = 0;
    let elapsedCount = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d > now) break;
      elapsedCount += 1;

      const key = toDateKey(d);
      const record = garden.history?.[key] ?? {};
      const both = !!record[uid] && !!partnerId && !!record[partnerId];
      if (both) bloomedCount += 1;
    }

    return { bloomed: bloomedCount, elapsed: elapsedCount };
  }, [garden.history, uid, partnerId]);

  if (elapsed === 0) return null;

  return (
    <View style={[styles.pill, { backgroundColor: colors.pillBackground }]}>
      <Text style={[styles.text, { color: colors.primary }]}>
        This week: {bloomed}/{elapsed} days bloomed together 🌱
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 16,
    alignSelf: "stretch",
  },
  text: { fontSize: 12, fontWeight: "600", textAlign: "center" },
});