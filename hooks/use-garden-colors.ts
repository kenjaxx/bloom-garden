import { useColorScheme } from "@/hooks/use-color-scheme";

export type FlowerColorKey = "pink" | "purple" | "coral" | "sunny";

export const FLOWER_COLORS: Record<FlowerColorKey, { label: string; swatch: string; emoji: string[] }> = {
  pink: { label: "Blossom", swatch: "#f48fb1", emoji: ["🌰", "🌱", "🌿", "🌷", "🌸"] },
  purple: { label: "Lavender", swatch: "#b39ddb", emoji: ["🌰", "🌱", "🌿", "💜", "🪻"] },
  coral: { label: "Sunset", swatch: "#ff8a65", emoji: ["🌰", "🌱", "🌿", "🌺", "🌻"] },
  sunny: { label: "Daisy", swatch: "#ffd54f", emoji: ["🌰", "🌱", "🌿", "🌼", "🌼"] },
};

const light = {
  scheme: "light" as const,
  background: "#eef5ee",
  // Gradient used behind full screens instead of a flat background fill.
  gradientFrom: "#f3f9f1",
  gradientTo: "#e2eee3",
  decorationA: "#dcefdc",
  decorationB: "#f6dbe8",
  cardBackground: "#ffffff",
  // Border is invisible in light mode — shadows carry the elevation instead.
  cardBorderColor: "transparent",
  cardShadowOpacity: 0.08,
  inputBackground: "#f8fbf8",
  inputBorder: "#e3ece3",
  text: "#22392a",
  textMuted: "#6f8272",
  textFaint: "#a3b0a3",
  icon: "#8a9a8a",
  primary: "#4caf50",
  primaryDisabled: "#a9d3ab",
  primaryOutlineDisabled: "#c8ddc9",
  pillBackground: "#f0f7f0",
  errorBackground: "#fdecea",
  errorText: "#c0392b",
  shadow: "#1c2e1f",
};

const dark = {
  scheme: "dark" as const,
  background: "#101913",
  gradientFrom: "#141f16",
  gradientTo: "#0c130d",
  decorationA: "#16261a",
  decorationB: "#2a1c22",
  cardBackground: "#182016",
  // Black shadows are invisible on a near-black card, so dark mode gets a
  // subtle border instead and the shadow opacity is turned off.
  cardBorderColor: "#26362a",
  cardShadowOpacity: 0,
  inputBackground: "#131a12",
  inputBorder: "#26362a",
  text: "#eaf3ea",
  textMuted: "#9fb0a0",
  textFaint: "#6c7c6d",
  icon: "#8fa88f",
  primary: "#66bb6a",
  primaryDisabled: "#345b37",
  primaryOutlineDisabled: "#2c3e2d",
  pillBackground: "#1d2a1e",
  errorBackground: "#3a2020",
  errorText: "#ff8a80",
  shadow: "#000000",
};

export type GardenColors = typeof light;

export function useGardenColors(): GardenColors {
  const scheme = useColorScheme() ?? "light";
  return scheme === "dark" ? dark : light;
}