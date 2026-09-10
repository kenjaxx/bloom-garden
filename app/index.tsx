import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../firebaseConfig";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/garden");
      }
    });
    return unsubscribe;
  }, []);

  const handleSignUp = async () => {
  setError("");
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (e: any) {
    setError(e.message || "Something went wrong.");
  }
};

const handleLogin = async () => {
  setError("");
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e: any) {
    setError(e.message || "Something went wrong.");
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌱 Bloom Garden</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonOutline} onPress={handleSignUp}>
        <Text style={styles.buttonOutlineText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f4f9f4" },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 32 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: "#fff" },
  button: { backgroundColor: "#4caf50", padding: 14, borderRadius: 8, marginTop: 8 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  buttonOutline: { padding: 14, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: "#4caf50" },
  buttonOutlineText: { color: "#4caf50", textAlign: "center", fontWeight: "600" },
  error: { color: "red", marginBottom: 8, textAlign: "center" },
});