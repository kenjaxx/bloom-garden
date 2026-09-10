import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../firebaseConfig";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(friendlyError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    !submitting;

  return (
    <View style={styles.container}>
      <View style={styles.topDecoration} pointerEvents="none" />

      <View style={styles.headerBlock}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🌸</Text>
        </View>
        <Text style={styles.title}>Create an Account</Text>
        <Text style={styles.subtitle}>Start a garden with someone you care about</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#8a9a8a" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#a3b0a3"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#8a9a8a" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.inputFlex]}
            placeholder="Password"
            placeholderTextColor="#a3b0a3"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} style={styles.eyeButton}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#8a9a8a" />
          </Pressable>
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color="#8a9a8a"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#a3b0a3"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#c0392b" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLinkRow}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.registerLinkText}>
            Already have an account? <Text style={styles.registerLinkBold}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function friendlyError(e: any) {
  const code = e?.code || "";
  if (code.includes("configuration-not-found")) {
    return "Sign-up isn't set up yet. Enable Email/Password in Firebase Console.";
  }
  if (code.includes("invalid-email")) return "That email address doesn't look right.";
  if (code.includes("email-already-in-use")) return "An account already exists with that email.";
  if (code.includes("weak-password")) return "Password should be at least 6 characters.";
  return e?.message || "Something went wrong. Please try again.";
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
    backgroundColor: "#f6dbe8",
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
    letterSpacing: 0.2,
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
    shadowColor: "#1c2e1f",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
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
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#22392a",
  },
  inputFlex: { marginRight: 6 },
  eyeButton: { padding: 4 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdecea",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 14,
    gap: 6,
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
  registerLinkRow: {
    marginTop: 18,
    alignItems: "center",
  },
  registerLinkText: {
    fontSize: 14,
    color: "#6f8272",
  },
  registerLinkBold: {
    color: "#4caf50",
    fontWeight: "700",
  },
});
