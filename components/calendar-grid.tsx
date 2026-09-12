import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Garden } from "@/hooks/use-garden";
import { todayString } from "@/hooks/use-garden";
import type { GardenColors } from "@/hooks/use-garden-colors";

type Props = {
  garden: Garden;
  uid: string;
  colors: GardenColors;
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

// Walks backward from lastSuccessDate for `streak` days to build the set of
// date keys that make up the *currently active* streak, so the calendar can
// flag them distinctly from one-off "both bloomed" days in the history.
function buildStreakDayKeys(lastSuccessDate: string | null, streak: number): Set<string> {
  const keys = new Set<string>();
  if (!lastSuccessDate || streak <= 0) return keys;
  const cursor = new Date(lastSuccessDate);
  for (let i = 0; i < streak; i++) {
    keys.add(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() - 1);
  }
  return keys;
}

export function CalendarGrid({ garden, uid, colors }: Props) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const partnerId = garden.members.find((m) => m !== uid);
  const today = todayString();

  const streakDayKeys = useMemo(
    () => buildStreakDayKeys(garden.lastSuccessDate, garden.streak),
    [garden.lastSuccessDate, garden.streak]
  );

  const { weeks, monthLabel, monthBloomed, monthElapsed } = useMemo(() => {
    const { year, month } = cursor;
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = firstDay.getDay();
    const now = new Date();

    const cells: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const weekRows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weekRows.push(cells.slice(i, i + 7));
    }

    const monthLabel = firstDay.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });

    // "Both bloomed" count for the month, only counting days that have
    // actually elapsed (so a future month, or the tail end of the current
    // month, doesn't drag the ratio down with days that haven't happened).
    let bloomed = 0;
    let elapsed = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d);
      if (dayDate > now) break;
      elapsed += 1;
      const key = toDateKey(year, month, d);
      const record = garden.history?.[key] ?? {};
      const both = !!record[uid] && !!partnerId && !!record[partnerId];
      if (both) bloomed += 1;
    }

    return { weeks: weekRows, monthLabel, monthBloomed: bloomed, monthElapsed: elapsed };
  }, [cursor, garden.history, uid, partnerId]);

  const goPrev = () =>
    setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }));
  const goNext = () =>
    setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }));

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          shadowColor: colors.shadow,
          shadowOpacity: colors.cardShadowOpacity,
          borderColor: colors.cardBorderColor,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={goPrev} hitSlop={10}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.monthLabel, { color: colors.text }]}>{monthLabel}</Text>
          {monthElapsed > 0 && (
            <Text style={[styles.monthStat, { color: colors.textMuted }]}>
              {monthBloomed}/{monthElapsed} days bloomed together
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={goNext} hitSlop={10}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={[styles.weekdayLabel, { color: colors.textFaint }]}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (day === null) return <View key={di} style={styles.dayCell} />;
            const key = toDateKey(cursor.year, cursor.month, day);
            const isToday = key === today;
            const record = garden.history?.[key] ?? {};

            const meDid = !!record[uid] || (isToday && garden.lastCheckIn[uid] === today);
            const partnerDid =
              (!!partnerId && !!record[partnerId]) ||
              (isToday && !!partnerId && garden.lastCheckIn[partnerId] === today);

            const both = meDid && partnerDid;
            const some = meDid || partnerDid;
            const inStreak = both && streakDayKeys.has(key);

            return (
              <View key={di} style={styles.dayCell}>
                <View
                  style={[
                    styles.dayCircle,
                    isToday && { borderWidth: 1.5, borderColor: colors.primary },
                    both && { backgroundColor: colors.primary, borderWidth: 0 },
                    some &&
                      !both && {
                        backgroundColor: colors.pillBackground,
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                      },
                  ]}
                >
                  <Text style={[styles.dayText, { color: both ? "#fff" : colors.text }]}>{day}</Text>
                </View>
                {inStreak && <Text style={styles.streakFlame}>🔥</Text>}
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Both bloomed</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.pillBackground, borderWidth: 1.5, borderColor: colors.primary },
            ]}
          />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>One checked in</Text>
        </View>
        {streakDayKeys.size > 0 && (
          <View style={styles.legendItem}>
            <Text style={styles.legendFlame}>🔥</Text>
            <Text style={[styles.legendText, { color: colors.textMuted }]}>Active streak</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  monthLabel: { fontSize: 16, fontWeight: "700" },
  monthStat: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  weekdayRow: { flexDirection: "row", marginBottom: 4 },
  weekdayLabel: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "600" },
  weekRow: { flexDirection: "row" },
  dayCell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  dayCircle: {
    width: "78%",
    height: "78%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 12, fontWeight: "600" },
  streakFlame: {
    position: "absolute",
    top: -4,
    right: 2,
    fontSize: 11,
  },
  legendRow: { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 12, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendFlame: { fontSize: 11 },
  legendText: { fontSize: 12 },
});