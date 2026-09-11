import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { REACTION_EMOJIS } from "@/hooks/use-garden";
import type { GardenColors } from "@/hooks/use-garden-colors";

type Props = {
  currentReaction?: string;
  onReact: (emoji: string) => void;
  colors: GardenColors;
};

export function NoteReaction({ currentReaction, onReact, colors }: Props) {
  return (
    <View style={styles.row}>
      {REACTION_EMOJIS.map((emoji) => {
        const selected = currentReaction === emoji;
        return (
          <TouchableOpacity
            key={emoji}
            onPress={() => onReact(emoji)}
            activeOpacity={0.7}
            style={[
              styles.chip,
              { backgroundColor: colors.inputBackground },
              selected && { backgroundColor: colors.pillBackground, borderColor: colors.primary },
            ]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, marginTop: 8 },
  chip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  emoji: { fontSize: 14 },
});
