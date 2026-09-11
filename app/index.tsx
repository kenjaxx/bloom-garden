import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { auth } from "../firebaseConfig";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const router = useRouter();

  // Gentle entrance animation so the screen feels considered rather than
  // just "popping in". Purely cosmetic — no logic depends on this.
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    // The native animation driver isn't available on web, and trying to
    // use it there just spams the console with a warning — so fall back
    // to the JS driver specifically on web.
    const useNativeDriver = Platform.OS !== "web";
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver }),
      Animated.timing(rise, { toValue: 0, duration: 450, useNativeDriver }),
    ]).start();
  }, [fade, rise]);

  // Note: there's no auth-state redirect here anymore. The root layout's
  // guard (contexts/auth-context.tsx + app/_layout.tsx) watches Firebase
  // auth state once, globally, and sends signed-in users to /(tabs)
  // automatically — including right after a successful login below.

  const handleLogin = async () => {
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError(friendlyError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email above first, then tap 'Forgot password?'");
      return;
    }
    setError("");
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "Check your inbox",
        `We sent a password reset link to ${email.trim()}.`
      );
    } catch (e: any) {
      setError(friendlyError(e));
    } finally {
      setSendingReset(false);
    }
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  return (
    <LinearGradient colors={["#eaf6ec", "#f4f9f4", "#fbeff4"]} style={styles.flexFill}>
      <KeyboardAvoidingView
        style={styles.flexFill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.decorationTop} pointerEvents="none" />
          <View style={styles.decorationBottom} pointerEvents="none" />

          <Animated.View
            style={[
              styles.animatedWrap,
              { opacity: fade, transform: [{ translateY: rise }] },
            ]}
          >
            <View style={styles.headerBlock}>
              <LinearGradient
                colors={["#ffffff", "#f3fbf3"]}
                style={styles.logoCircle}
              >
                <Text style={styles.logoEmoji}>🌱</Text>
              </LinearGradient>
              <Text style={styles.title}>Bloom Garden</Text>
              <Text style={styles.subtitle}>Grow something together, one day at a time</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#8a9a8a" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#a3b0a3"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
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
                  returnKeyType="done"
                  onSubmitEditing={canSubmit ? handleLogin : undefined}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#8a9a8a" />
                </Pressable>
              </View>

              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={sendingReset}
                style={styles.forgotRow}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>
                  {sendingReset ? "Sending reset link..." : "Forgot password?"}
                </Text>
              </TouchableOpacity>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#c0392b" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={!canSubmit}
                activeOpacity={0.85}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerLinkRow}
                onPress={() => router.push("/register")}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLinkText}>
                  Don&apos;t have an account? <Text style={styles.registerLinkBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>
              Check in daily with your partner and watch your garden bloom 🌸
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function friendlyError(e: any) {
  const code = e?.code || "";
  if (code.includes("configuration-not-found")) {
    return "Sign-in isn't set up yet. Enable Email/Password in Firebase Console.";
  }
  if (code.includes("invalid-email")) return "That email address doesn't look right.";
  if (code.includes("user-not-found")) return "No account found with that email.";
  if (
    code.includes("wrong-password") ||
    code.includes("invalid-credential")
  ) {
    return "Incorrect email or password.";
  }
  return e?.message || "Something went wrong. Please try again.";
}

const styles = StyleSheet.create({
  flexFill: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  decorationTop: {
    position: "absolute",
    top: -110,
    right: "50%",
    marginRight: -320,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#dcefdc",
    opacity: 0.8,
  },
  decorationBottom: {
    position: "absolute",
    bottom: -130,
    left: "50%",
    marginLeft: -300,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#f6dbe8",
    opacity: 0.6,
  },
  animatedWrap: {
    width: "100%",
    alignItems: "center",
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: 28,
    width: "100%",
    maxWidth: 420,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#2f5233",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
  },
  logoEmoji: { fontSize: 38 },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#22392a",
    letterSpacing: 0.2,
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
    borderRadius: 24,
    padding: 24,
    shadowColor: "#1c2e1f",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 4,
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
  forgotRow: {
    alignSelf: "flex-end",
    marginBottom: 14,
    marginTop: -6,
  },
  forgotText: {
    color: "#4caf50",
    fontSize: 13,
    fontWeight: "600",
  },
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
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4caf50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
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
  footerText: {
    textAlign: "center",
    color: "#8a9a8a",
    fontSize: 12,
    marginTop: 22,
    paddingHorizontal: 20,
    maxWidth: 420,
  },
});