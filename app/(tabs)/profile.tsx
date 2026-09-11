import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { auth } from "@/firebaseConfig";
import { useGarden } from "@/hooks/use-garden";
import { FLOWER_COLORS, FlowerColorKey, useGardenColors } from "@/hooks/use-garden-colors";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useGardenColors();
  const { garden, uid, setFlowerColor, leaveGarden, updateGardenName } = useGarden();
  const [leaving, setLeaving] = useState(false);
  const [nameDraft, setNameDraft] = useState(garden?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const styles = getStyles(colors);

  const stats = useMemo(() => {
    if (!garden) return null;
    const partnerId = garden.members.find((m) => m !== uid);
    let bothBloomed = 0;
    let soloBloomed = 0;
    for (const record of Object.values(garden.history ?? {})) {
      const meDid = !!record[uid];
      const partnerDid = !!partnerId && !!record[partnerId];
      if (meDid && partnerDid) bothBloomed += 1;
      else if (meDid || partnerDid) soloBloomed += 1;
    }
    const createdAt = garden.createdAt as { toDate?: () => Date } | Date | null;
    let ageDays: number | null = null;
    const createdDate =
      createdAt && typeof (createdAt as any).toDate === "function"
        ? (createdAt as any).toDate()
        : createdAt instanceof Date
        ? createdAt
        : null;
    if (createdDate) {
      ageDays = Math.max(0, Math.round((Date.now() - createdDate.getTime()) / 86400000));
    }
    return { bothBloomed, soloBloomed, ageDays };
  }, [garden, uid]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/");
  };

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await updateGardenName(nameDraft);
    } finally {
      setSavingName(false);
    }
  };

  const handleLeaveGarden = () => {
    const streakWarning =
      garden && garden.streak > 0
        ? ` You currently have a ${garden.streak}-day streak that will be lost.`
        : "";
    Alert.alert(
      "Leave this garden?",
      `You'll need a new invite code to join again, and your progress in this garden will be lost.${streakWarning}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            setLeaving(true);
            try {
              await leaveGarden();
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>👤 Profile</Text>
        <Text style={styles.email}>{auth.currentUser?.email}</Text>

        {garden ? (
          <>
            {stats && (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.bothBloomed}</Text>
                  <Text style={styles.statLabel}>days bloomed{"\n"}together</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{garden.streak}</Text>
                  <Text style={styles.statLabel}>current{"\n"}streak</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.ageDays ?? "–"}</Text>
                  <Text style={styles.statLabel}>days since{"\n"}planted</Text>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Garden name</Text>
              <View style={styles.nameRow}>
                <TextInput
                  style={styles.nameInput}
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="Name your garden"
                  placeholderTextColor={colors.textFaint}
                  maxLength={40}
                />
                <TouchableOpacity
                  style={[styles.saveNameButton, savingName && styles.buttonDisabled]}
                  onPress={handleSaveName}
                  disabled={savingName || nameDraft.trim() === (garden.name ?? "")}
                >
                  <Text style={styles.saveNameButtonText}>{savingName ? "..." : "Save"}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>Shown to both members instead of the invite code.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Flower color</Text>
              <View style={styles.swatchRow}>
                {(Object.keys(FLOWER_COLORS) as FlowerColorKey[]).map((key) => {
                  const option = FLOWER_COLORS[key];
                  const selected = garden.flowerColor === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setFlowerColor(key)}
                      style={[
                        styles.swatch,
                        { backgroundColor: option.swatch },
                        selected && styles.swatchSelected,
                      ]}
                      activeOpacity={0.8}
                    >
                      {selected ? <Text style={styles.swatchCheck}>✓</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.hint}>Applies to both members of the garden.</Text>
            </View>

            {garden.freezes > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Streak freezes</Text>
                <Text style={styles.freezeText}>
                  🧊 You have {garden.freezes} banked. One is used automatically to protect your
                  streak if you both miss a day.
                </Text>
              </View>
            )}
          </>
        ) : null}

        <TouchableOpacity style={styles.buttonOutline} onPress={() => router.back()}>
          <Text style={styles.buttonOutlineText}>Back to Garden</Text>
        </TouchableOpacity>

        {garden ? (
          <TouchableOpacity
            style={[styles.buttonOutline, styles.leaveButton]}
            onPress={handleLeaveGarden}
            disabled={leaving}
          >
            <Text style={[styles.buttonOutlineText, styles.leaveButtonText]}>
              {leaving ? "Leaving..." : "Leave Garden"}
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function getStyles(colors: ReturnType<typeof useGardenColors>) {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: colors.background,
    },
    content: {
      width: "100%",
      maxWidth: 420,
      alignItems: "center",
    },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 12, color: colors.text },
    email: { fontSize: 16, color: colors.textMuted, marginBottom: 24 },
    statsRow: {
      flexDirection: "row",
      width: "100%",
      gap: 10,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.cardBorderColor,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: colors.cardShadowOpacity,
      shadowRadius: 8,
      elevation: 2,
    },
    statValue: { fontSize: 22, fontWeight: "800", color: colors.primary },
    statLabel: { fontSize: 10, color: colors.textMuted, textAlign: "center", marginTop: 4, lineHeight: 13 },
    section: { width: "100%", marginBottom: 24 },
    sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 10 },
    nameRow: { flexDirection: "row", gap: 10 },
    nameInput: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 46,
      color: colors.text,
      fontSize: 14,
    },
    saveNameButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    saveNameButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
    swatchRow: { flexDirection: "row", gap: 14 },
    swatch: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },
    swatchSelected: { borderColor: colors.text },
    swatchCheck: { color: "#fff", fontWeight: "800" },
    hint: { fontSize: 12, color: colors.textFaint, marginTop: 10 },
    freezeText: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
    button: {
      backgroundColor: "#e53935",
      padding: 14,
      borderRadius: 8,
      width: "100%",
      marginTop: 12,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
    buttonOutline: {
      padding: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      width: "100%",
      marginTop: 12,
    },
    buttonOutlineText: { color: colors.primary, textAlign: "center", fontWeight: "600" },
    leaveButton: { borderColor: "#e53935" },
    leaveButtonText: { color: "#e53935" },
  });
}
