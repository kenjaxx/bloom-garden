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
import { auth, db } from "../firebaseConfig";
import { registerForDailyReminder } from "../notifications";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

const STAGE_NAMES = ["Seed", "Sprout", "Bud", "Blooming", "Full Bloom"];
const STAGE_EMOJIS = ["🌰", "🌱", "🌿", "🌷", "🌸"];

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

export default function GardenScreen() {
  const [loading, setLoading] = useState(true);
  const [garden, setGarden] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "gardens"), where("members", "array-contains", uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setGarden({ id: docSnap.id, ...docSnap.data() });
        } else {
          setGarden(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("onSnapshot error:", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  useEffect(() => {
    if (garden) {
      registerForDailyReminder();
    }
  }, [garden?.id]);

  const handleCreateGarden = async () => {
    setError("");
    setCreating(true);
    try {
      await addDoc(collection(db, "gardens"), {
        code: generateCode(),
        members: [uid],
        stage: 0,
        lastCheckIn: {},
        lastSuccessDate: null,
        createdAt: new Date(),
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGarden = async () => {
    setError("");
    setJoining(true);
    try {
      const q = query(collection(db, "gardens"), where("code", "==", joinCode.toUpperCase()));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setError("No garden found with that code.");
        return;
      }
      const gardenDoc = snapshot.docs[0];
      const data = gardenDoc.data();

      if (data.members.includes(uid)) {
        setError("You're already in this garden.");
        return;
      }
      if (data.members.length >= 2) {
        setError("This garden is already full.");
        return;
      }

      await updateDoc(doc(db, "gardens", gardenDoc.id), {
        members: arrayUnion(uid),
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setJoining(false);
    }
  };

  const handleCheckIn = async () => {
    if (!garden) return;
    const today = todayString();
    const updatedCheckIns = { ...garden.lastCheckIn, [uid]: today };

    const allCheckedIn = garden.members.every((memberId) => updatedCheckIns[memberId] === today);

    const updates: any = { lastCheckIn: updatedCheckIns };

    if (allCheckedIn && garden.members.length > 1) {
      let newStage = garden.stage;
      if (garden.lastSuccessDate) {
        const last = new Date(garden.lastSuccessDate);
        const now = new Date(today);
        const dayGap = Math.round((now - last) / (1000 * 60 * 60 * 24));
        if (dayGap > 1) {
          newStage = Math.max(0, garden.stage - 1);
        }
      }
      updates.stage = Math.min(newStage + 1, STAGE_NAMES.length - 1);
      updates.lastSuccessDate = today;
    }

    try {
      await updateDoc(doc(db, "gardens", garden.id), updates);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const alreadyCheckedInToday = garden?.lastCheckIn?.[uid] === todayString();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

  if (!garden) {
    return (
      <View style={styles.container}>
        <View style={styles.topDecoration} pointerEvents="none" />

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
            <Ionicons name="key-outline" size={20} color="#8a9a8a" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter invite code"
              placeholderTextColor="#a3b0a3"
              autoCapitalize="characters"
              value={joinCode}
              onChangeText={setJoinCode}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#c0392b" />
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
              <ActivityIndicator color="#4caf50" />
            ) : (
              <Text style={styles.buttonOutlineText}>Join Garden</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/profile")} activeOpacity={0.7}>
          <Text style={styles.linkText}>Profile / Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topDecoration} pointerEvents="none" />

      <View style={styles.gardenCard}>
        <View style={styles.flowerFallback}>
          <Text style={styles.flowerFallbackEmoji}>{STAGE_EMOJIS[garden.stage]}</Text>
        </View>

        <Text style={styles.stageText}>{STAGE_NAMES[garden.stage]}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="key-outline" size={14} color="#4caf50" />
            <Text style={styles.metaPillText}>{garden.code}</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="people-outline" size={14} color="#4caf50" />
            <Text style={styles.metaPillText}>{garden.members.length}/2 members</Text>
          </View>
        </View>

        {garden.members.length < 2 ? (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>Waiting for your partner to join...</Text>
          </View>
        ) : alreadyCheckedInToday ? (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>✅ You checked in today. Waiting on your partner!</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleCheckIn} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Check In Today 🌤️</Text>
          </TouchableOpacity>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#c0392b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity onPress={() => router.push("/profile")} activeOpacity={0.7}>
        <Text style={styles.linkText}>Profile / Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#eef5ee",
  },
  topDecoration: {
    position: "absolute",
    top: -100,
    right: "50%",
    marginRight: -340,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#dcefdc",
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: 28,
    width: "100%",
    maxWidth: 420,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#2f5233",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  logoEmoji: { fontSize: 34 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#22392a",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6f8272",
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    shadowColor: "#1c2e1f",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  gardenCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#1c2e1f",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  flowerFallback: { width: 220, height: 220, justifyContent: "center", alignItems: "center" },
  flowerFallbackEmoji: { fontSize: 88 },
  stageText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#22392a",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 20,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0f7f0",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  metaPillText: {
    fontSize: 13,
    color: "#4caf50",
    fontWeight: "600",
  },
  waitingBox: {
    backgroundColor: "#f8fbf8",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: "100%",
  },
  waitingText: {
    color: "#6f8272",
    textAlign: "center",
    fontSize: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e3ece3",
    backgroundColor: "#f8fbf8",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 52,
    width: "100%",
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#22392a",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdecea",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 14,
    marginTop: 4,
    gap: 6,
    width: "100%",
  },
  errorText: {
    color: "#c0392b",
    fontSize: 13,
    flex: 1,
  },
  button: {
    backgroundColor: "#4caf50",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#4caf50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#a9d3ab",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e3ece3",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#a3b0a3",
    fontSize: 12,
    fontWeight: "600",
  },
  buttonOutline: {
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#4caf50",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonOutlineDisabled: {
    borderColor: "#c8ddc9",
  },
  buttonOutlineText: {
    color: "#4caf50",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },
  linkText: {
    color: "#4caf50",
    fontWeight: "600",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});