import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { auth, db } from "../firebaseConfig";
import { registerForDailyReminder } from "../notifications";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  arrayUnion,
  doc,
  onSnapshot,
} from "firebase/firestore";

const STAGE_NAMES = ["Seed", "Sprout", "Bud", "Blooming", "Full Bloom"];

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
  const animationRef = useRef(null);
  const router = useRouter();

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "gardens"), where("members", "array-contains", uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setGarden({ id: docSnap.id, ...docSnap.data() });
      } else {
        setGarden(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [uid]);

  useEffect(() => {
    if (garden) {
      registerForDailyReminder();
    }
  }, [garden?.id]);

  const handleCreateGarden = async () => {
    setError("");
    try {
      await addDoc(collection(db, "gardens"), {
        code: generateCode(),
        members: [uid],
        stage: 0,
        lastCheckIn: {},
        lastSuccessDate: null,
        createdAt: new Date(),
      });
    } catch (e) {
      setError(e.message);
    }
  };

  const handleJoinGarden = async () => {
    setError("");
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
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCheckIn = async () => {
    if (!garden) return;
    const today = todayString();
    const updatedCheckIns = { ...garden.lastCheckIn, [uid]: today };

    const allCheckedIn = garden.members.every((memberId) => updatedCheckIns[memberId] === today);

    const updates = { lastCheckIn: updatedCheckIns };

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

    await updateDoc(doc(db, "gardens", garden.id), updates);
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
        <Text style={styles.title}>🌱 No garden yet</Text>
        <TouchableOpacity style={styles.button} onPress={handleCreateGarden}>
          <Text style={styles.buttonText}>Create a Garden</Text>
        </TouchableOpacity>
        <Text style={styles.orText}>— or —</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter invite code"
          autoCapitalize="characters"
          value={joinCode}
          onChangeText={setJoinCode}
        />
        <TouchableOpacity style={styles.buttonOutline} onPress={handleJoinGarden}>
          <Text style={styles.buttonOutlineText}>Join Garden</Text>
        </TouchableOpacity>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.linkButton} onPress={() => router.push("/profile")}>
          <Text style={styles.linkText}>Profile / Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        source={require("../assets/animations/flower.json")}
        style={styles.flowerAnimation}
        progress={garden.stage / (STAGE_NAMES.length - 1)}
        autoPlay={false}
        loop={false}
      />
      <Text style={styles.stageText}>{STAGE_NAMES[garden.stage]}</Text>
      <Text style={styles.codeText}>Invite code: {garden.code}</Text>
      <Text style={styles.membersText}>Members: {garden.members.length}</Text>

      {garden.members.length < 2 ? (
        <Text style={styles.waitingText}>Waiting for your partner to join...</Text>
      ) : alreadyCheckedInToday ? (
        <Text style={styles.waitingText}>✅ You checked in today. Waiting on your partner!</Text>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleCheckIn}>
          <Text style={styles.buttonText}>Check In Today 🌤️</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.linkButton} onPress={() => router.push("/profile")}>
        <Text style={styles.linkText}>Profile / Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#f4f9f4" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  flowerAnimation: { width: 250, height: 250 },
  stageText: { fontSize: 22, fontWeight: "700", marginTop: 4 },
  orText: { marginVertical: 12, color: "#888" },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: "#fff" },
  button: { backgroundColor: "#4caf50", padding: 14, borderRadius: 8, width: "100%", marginTop: 20 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  buttonOutline: { padding: 14, borderRadius: 8, borderWidth: 1, borderColor: "#4caf50", width: "100%" },
  buttonOutlineText: { color: "#4caf50", textAlign: "center", fontWeight: "600" },
  error: { color: "red", marginTop: 8, textAlign: "center" },
  codeText: { marginTop: 16, fontSize: 16, color: "#4caf50", fontWeight: "600" },
  membersText: { marginTop: 4, color: "#666" },
  waitingText: { marginTop: 20, color: "#888", textAlign: "center" },
  linkButton: { marginTop: 30 },
  linkText: { color: "#4caf50", textDecorationLine: "underline" },
});