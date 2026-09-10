import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";

export default function ProfileScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Profile</Text>
      <Text style={styles.email}>{auth.currentUser?.email}</Text>

      <TouchableOpacity style={styles.buttonOutline} onPress={() => router.back()}>
        <Text style={styles.buttonOutlineText}>Back to Garden</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#f4f9f4" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  email: { fontSize: 16, color: "#666", marginBottom: 32 },
  button: { backgroundColor: "#e53935", padding: 14, borderRadius: 8, width: "100%", marginTop: 12 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  buttonOutline: { padding: 14, borderRadius: 8, borderWidth: 1, borderColor: "#4caf50", width: "100%" },
  buttonOutlineText: { color: "#4caf50", textAlign: "center", fontWeight: "600" },
});