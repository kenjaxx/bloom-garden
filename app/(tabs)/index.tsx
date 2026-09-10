import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { FlowerStage } from "@/components/flower-stage";
import { MilestoneCelebration } from "@/components/milestone-celebration";
import { useGarden, STAGE_NAMES } from "@/hooks/use-garden";
import { useGardenColors } from "@/hooks/use-garden-colors";

export default function GardenScreen() {
  const colors = useGardenColors();
  const router = useRouter();
  const {
    loading,
    garden,
    error,
    setError,
    milestone,
    clearMilestone,
    createGarden,
    joinGarden,
    checkIn,
    partnerCheckedInToday,
    iCheckedInToday,
    partnerNote,
    myNote,
  } = useGarden();

  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (!milestone) return;
    const timeout = setTimeout(clearMilestone, 3200);
    return () => clearTimeout(timeout);
  }, [milestone, clearMilestone]);

  const handleCreateGarden = async () => {
    setCreating(true);
    try {
      await createGarden();
    } catch {
      // error already surfaced via hook
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGarden = async () => {
    setJoining(true);
    try {
      await joinGarden(joinCode);
    } catch {
      // error already surfaced via hook
    } finally {
      setJoining(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await checkIn(noteDraft);
      setNoteDraft("");
    } finally {
      setCheckingIn(false);
    }
  };

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
        <View style={[styles.topDecoration, { backgroundColor: colors.decorationA }]} pointerEvents="none" />

        <View style={styles.headerBlock}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🌱</Text>
          </View>
          <Text style={styles.title}>No Garden Yet</Text>
          <Text style={styles.subtitle}>Create one, or join your partner's with an invite code</Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.button, creating && styles.buttonDisabled]}
            onPress={handleCreateGarden}
            disabled={creating}
            activeOpacity={0.85}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create a Garden</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="key-outline" size={20} color={colors.icon} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter invite code"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="characters"
              value={joinCode}
              onChangeText={setJoinCode}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.errorText} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.buttonOutline, joining && styles.buttonOutlineDisabled]}
            onPress={handleJoinGarden}
            disabled={joining}
            activeOpacity={0.85}
          >
            {joining ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.buttonOutlineText}>Join Garden</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topDecoration, { backgroundColor: colors.decorationA }]} pointerEvents="none" />

      <MilestoneCelebration milestone={milestone} onDone={clearMilestone} />

      <View style={styles.gardenCard}>
        <FlowerStage stage={garden.stage} flowerColor={garden.flowerColor} />

        <Text style={styles.stageText}>{STAGE_NAMES[garden.stage]}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="key-outline" size={14} color={colors.primary} />
            <Text style={styles.metaPillText}>{garden.code}</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="people-outline" size={14} color={colors.primary} />
            <Text style={styles.metaPillText}>{garden.members.length}/2 members</Text>
          </View>
          {garden.streak > 0 && (
            <View style={styles.metaPill}>
              <Ionicons name="flame-outline" size={14} color={colors.primary} />
              <Text style={styles.metaPillText}>{garden.streak}-day streak</Text>
            </View>
          )}
        </View>

        {garden.members.length > 1 && (
          <View style={styles.presenceRow}>
            <Ionicons
              name={partnerCheckedInToday ? "checkmark-circle" : "time-outline"}
              size={16}
              color={partnerCheckedInToday ? colors.primary : colors.textFaint}
            />
            <Text style={styles.presenceText}>
              {partnerCheckedInToday ? "Your partner checked in today" : "Your partner hasn't checked in yet"}
            </Text>
          </View>
        )}

        {partnerNote ? (
          <View style={styles.noteBubble}>
            <Text style={styles.noteBubbleText}>💬 “{partnerNote.text}”</Text>
          </View>
        ) : null}

        {garden.members.length < 2 ? (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>Waiting for your partner to join...</Text>
          </View>
        ) : iCheckedInToday ? (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>✅ You checked in today. Waiting on your partner!</Text>
            {myNote ? <Text style={styles.myNoteText}>Your note: “{myNote.text}”</Text> : null}
          </View>
        ) : (
          <>
            <View style={styles.inputWrapper}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.icon} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Leave a note for your partner (optional)"
                placeholderTextColor={colors.textFaint}
                value={noteDraft}
                onChangeText={setNoteDraft}
                maxLength={140}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, checkingIn && styles.buttonDisabled]}
              onPress={handleCheckIn}
              disabled={checkingIn}
              activeOpacity={0.85}
            >
              {checkingIn ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Check In Today 🌤️</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.errorText} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>
    </View>
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
    topDecoration: {
      position: "absolute",
      top: -100,
      right: "50%",
      marginRight: -340,
      width: 260,
      height: 260,
      borderRadius: 130,
    },
    headerBlock: { alignItems: "center", marginBottom: 28, width: "100%", maxWidth: 420 },
    logoCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.cardBackground,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
    logoEmoji: { fontSize: 34 },
    title: { fontSize: 26, fontWeight: "800", color: colors.text, textAlign: "center" },
    subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 6, textAlign: "center" },
    card: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 22,
      marginBottom: 24,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 3,
    },
    gardenCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 28,
      marginBottom: 24,
      alignItems: "center",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 3,
    },
    stageText: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 4 },
    metaRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 14, marginBottom: 12 },
    metaPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.pillBackground,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    metaPillText: { fontSize: 13, color: colors.primary, fontWeight: "600" },
    presenceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
    presenceText: { fontSize: 13, color: colors.textMuted },
    noteBubble: {
      backgroundColor: colors.pillBackground,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: 16,
      width: "100%",
    },
    noteBubbleText: { color: colors.text, fontSize: 13, fontStyle: "italic" },
    myNoteText: { color: colors.textMuted, fontSize: 12, marginTop: 6, textAlign: "center" },
    waitingBox: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      width: "100%",
    },
    waitingText: { color: colors.textMuted, textAlign: "center", fontSize: 14 },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBackground,
      borderRadius: 14,
      paddingHorizontal: 14,
      marginBottom: 14,
      height: 52,
      width: "100%",
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: colors.text },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.errorBackground,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 14,
      marginTop: 4,
      gap: 6,
      width: "100%",
    },
    errorText: { color: colors.errorText, fontSize: 13, flex: 1 },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 3,
    },
    buttonDisabled: { backgroundColor: colors.primaryDisabled, shadowOpacity: 0, elevation: 0 },
    buttonText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 15 },
    dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 18 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.inputBorder },
    dividerText: { marginHorizontal: 10, color: colors.textFaint, fontSize: 12, fontWeight: "600" },
    buttonOutline: {
      paddingVertical: 15,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonOutlineDisabled: { borderColor: colors.primaryOutlineDisabled },
    buttonOutlineText: { color: colors.primary, textAlign: "center", fontWeight: "700", fontSize: 15 },
  });
}
