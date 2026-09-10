import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { FlowerStage } from "@/components/flower-stage";
import { MilestoneCelebration } from "@/components/milestone-celebration";
import { Toast } from "@/components/toast";
import { WeeklyRecap } from "@/components/weekly-recap";
import { useGarden, STAGE_NAMES } from "@/hooks/use-garden";
import { useGardenColors } from "@/hooks/use-garden-colors";

export default function GardenScreen() {
  const colors = useGardenColors();
  const {
    uid,
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const flashOpacity = useSharedValue(0);
  const prevStageRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!milestone) return;
    const timeout = setTimeout(clearMilestone, 3200);
    return () => clearTimeout(timeout);
  }, [milestone, clearMilestone]);

  // Surface hook errors as an auto-dismissing toast instead of a
  // permanent inline box.
  useEffect(() => {
    if (!error) return;
    setToastMessage(error);
    const timeout = setTimeout(() => {
      setToastMessage(null);
      setError("");
    }, 3000);
    return () => clearTimeout(timeout);
  }, [error, setError]);

  // Flash the garden card background briefly whenever the stage changes,
  // to sell the "something just happened" moment beyond the flower's own
  // pop animation.
  useEffect(() => {
    if (!garden) return;
    if (prevStageRef.current !== undefined && garden.stage !== prevStageRef.current) {
      flashOpacity.value = withSequence(withTiming(0.35, { duration: 150 }), withTiming(0, { duration: 700 }));
    }
    prevStageRef.current = garden.stage;
  }, [garden?.stage, flashOpacity, garden]);

  const flashStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: flashOpacity.value,
    borderRadius: 20,
  }));

  const handleCreateGarden = async () => {
    setCreating(true);
    try {
      await createGarden();
    } catch {
      // error already surfaced via hook -> toast
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGarden = async () => {
    setJoining(true);
    try {
      await joinGarden(joinCode);
    } catch {
      // error already surfaced via hook -> toast
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

  const handleCopyCode = async () => {
    if (!garden) return;
    await Clipboard.setStringAsync(garden.code);
    setToastMessage("Invite code copied!");
    setTimeout(() => setToastMessage(null), 1800);
  };

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

  if (!garden) {
    return (
      <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={styles.flexFill}>
        <View style={styles.container}>
          <View style={[styles.topDecoration, { backgroundColor: colors.decorationA }]} pointerEvents="none" />
          <Toast message={toastMessage} colors={colors} />

          <View style={styles.headerBlock}>
            <View style={styles.logoCircle}>
              <FlowerStage stage={0} flowerColor="pink" size={64} />
            </View>
            <Text style={styles.title}>No Garden Yet</Text>
            <Text style={styles.subtitle}>Create one, or join your partner's with an invite code</Text>
          </View>

          <View
            style={[
              styles.card,
              { borderColor: colors.cardBorderColor, shadowOpacity: colors.cardShadowOpacity },
            ]}
          >
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
      </LinearGradient>
    );
  }

  const bothCheckedInToday = iCheckedInToday && partnerCheckedInToday;

  return (
    <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={styles.flexFill}>
      <View style={styles.container}>
        <View style={[styles.topDecoration, { backgroundColor: colors.decorationA }]} pointerEvents="none" />

        <Toast message={toastMessage} colors={colors} />
        <MilestoneCelebration milestone={milestone} onDone={clearMilestone} />

        <View
          style={[
            styles.gardenCard,
            { borderColor: colors.cardBorderColor, shadowOpacity: colors.cardShadowOpacity },
          ]}
        >
          <Animated.View pointerEvents="none" style={flashStyle} />

          <Text style={styles.gardenName} numberOfLines={1}>
            {garden.name || "Your Garden"}
          </Text>

          <FlowerStage stage={garden.stage} flowerColor={garden.flowerColor} />

          <Text style={styles.stageText}>{STAGE_NAMES[garden.stage]}</Text>

          <View style={styles.metaRow}>
            <TouchableOpacity style={styles.metaPill} onPress={handleCopyCode} activeOpacity={0.7}>
              <Ionicons name="key-outline" size={14} color={colors.primary} />
              <Text style={[styles.metaPillText, styles.codeText]}>{garden.code}</Text>
              <Ionicons name="copy-outline" size={12} color={colors.primary} />
            </TouchableOpacity>
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
            {garden.freezes > 0 && (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>🧊 {garden.freezes} freeze{garden.freezes > 1 ? "s" : ""}</Text>
              </View>
            )}
          </View>

          <WeeklyRecap garden={garden} uid={uid} colors={colors} />

          {garden.members.length > 1 && !bothCheckedInToday && (
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
          ) : bothCheckedInToday ? (
            <View style={styles.waitingBox}>
              <Text style={styles.waitingText}>🌸 You both checked in today! See you tomorrow.</Text>
              {myNote ? <Text style={styles.myNoteText}>Your note: “{myNote.text}”</Text> : null}
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
              {checkingIn ? <Text style={styles.syncingText}>Syncing your check-in...</Text> : null}
            </>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

function getStyles(colors: ReturnType<typeof useGardenColors>) {
  return StyleSheet.create({
    flexFill: { flex: 1 },
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    topDecoration: {
      position: "absolute",
      top: -100,
      right: "50%",
      marginRight: -340,
      width: 260,
      height: 260,
      borderRadius: 130,
      opacity: 0.7,
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
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: colors.cardShadowOpacity,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: colors.cardBorderColor,
    },
    title: { fontSize: 26, fontWeight: "800", color: colors.text, textAlign: "center" },
    subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 6, textAlign: "center" },
    card: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 22,
      marginBottom: 24,
      borderWidth: 1,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
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
      overflow: "hidden",
      position: "relative",
      borderWidth: 1,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 24,
      elevation: 3,
    },
    gardenName: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    stageText: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 4 },
    metaRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 14, marginBottom: 4 },
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
    codeText: { fontFamily: "monospace", letterSpacing: 1.5 },
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
    syncingText: { color: colors.textFaint, fontSize: 12, textAlign: "center", marginTop: 8 },
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