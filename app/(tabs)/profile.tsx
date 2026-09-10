import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { auth } from "@/firebaseConfig";
import { useGarden } from "@/hooks/use-garden";
import { FLOWER_COLORS, FlowerColorKey, useGardenColors } from "@/hooks/use-garden-colors";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useGardenColors();
  const { garden, setFlowerColor, leaveGarden } = useGarden();
  const [leaving, setLeaving] = useState(false);
  const styles = getStyles(colors);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/");
  };

  const handleLeaveGarden = () => {
    Alert.alert(
      "Leave this garden?",
      "You'll need a new invite code to join again, and your progress in this garden will be lost.",
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
      <Text style={styles.title}>👤 Profile</Text>
      <Text style={styles.email}>{auth.currentUser?.email}</Text>

      {garden ? (
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
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 12, color: colors.text },
    email: { fontSize: 16, color: colors.textMuted, marginBottom: 32 },
    section: { width: "100%", marginBottom: 24 },
    sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 10 },
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
    button: {
      backgroundColor: "#e53935",
      padding: 14,
      borderRadius: 8,
      width: "100%",
      marginTop: 12,
    },
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
