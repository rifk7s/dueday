/**
 * Design System Colors & Typography
 * Based on DESIGN.md - Minimalist-Modern aesthetic
 */

export const colors = {
  // Surface Colors
  surface: "#f8f9ff",
  surfaceDim: "#d1dbec",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#eef4ff",
  surfaceContainer: "#e5eeff",
  surfaceContainerHigh: "#dfe9fa",
  surfaceContainerHighest: "#d9e3f4",
  onSurface: "#121c28",
  onSurfaceVariant: "#584237",
  inverseSurface: "#27313e",
  inverseOnSurface: "#eaf1ff",

  // Outline
  outline: "#8c7164",
  outlineVariant: "#e0c0b1",
  surfaceTint: "#9d4300",

  // Primary (Orange)
  primary: "#9d4300",
  onPrimary: "#ffffff",
  primaryContainer: "#f97316", // Main orange
  onPrimaryContainer: "#582200",
  inversePrimary: "#ffb690",
  primaryFixed: "#ffdbca",
  primaryFixedDim: "#ffb690",
  onPrimaryFixed: "#341100",
  onPrimaryFixedVariant: "#783200",

  // Secondary (Light Orange)
  secondary: "#944a00",
  onSecondary: "#ffffff",
  secondaryContainer: "#fd933d",
  onSecondaryContainer: "#693300",
  secondaryFixed: "#ffdcc5",
  secondaryFixedDim: "#ffb783",
  onSecondaryFixed: "#301400",
  onSecondaryFixedVariant: "#713700",

  // Tertiary
  tertiary: "#625e56",
  onTertiary: "#ffffff",
  tertiaryContainer: "#a09a91",
  onTertiaryContainer: "#36322c",
  tertiaryFixed: "#e9e1d8",
  tertiaryFixedDim: "#ccc5bc",
  onTertiaryFixed: "#1e1b15",
  onTertiaryFixedVariant: "#4a463f",

  // Error
  error: "#ba1a1a",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",

  // Background
  background: "#f8f9ff",
  onBackground: "#121c28",

  // Semantic
  success: "#12a14f",
  warning: "#f97316",
  surfaceWarm: "#fff7ed",
  surfaceSuccess: "#f0fdf4",
  errorSoft: "#fef2f2",
  errorStrong: "#ef4444",
  iconMuted: "#a5a5a5",
  iconSubtle: "#b9b9b9",
  progressTrack: "#e5e7eb",
  inputBorder: "#d1d5db",

  // Elearn source badge
  elearn: "#366AE5",
} as const;

/**
 * Lexend variants — keyed by React Native fontWeight string.
 * Use these instead of `fontWeight` so iOS picks the correct Google Font
 * variant (RN custom fonts don't auto-select a weight from `fontWeight`,
 * and combining fontWeight + a variant fontFamily makes iOS fall back).
 */
export const fonts = {
  "400": "Lexend_400Regular",
  "500": "Lexend_500Medium",
  "600": "Lexend_600SemiBold",
  "700": "Lexend_700Bold",
  "800": "Lexend_800ExtraBold",
  "900": "Lexend_900Black",
} as const;

export const typography = {
  h1: {
    fontFamily: "Lexend_700Bold",
    fontSize: 32,
    lineHeight: 1.2,
    letterSpacing: -0.02,
  },
  h2: {
    fontFamily: "Lexend_700Bold",
    fontSize: 24,
    lineHeight: 1.3,
    letterSpacing: -0.01,
  },
  h3: {
    fontFamily: "Lexend_600SemiBold",
    fontSize: 20,
    lineHeight: 1.4,
  },
  bodyLg: {
    fontFamily: "Lexend_400Regular",
    fontSize: 16,
    lineHeight: 1.6,
  },
  bodySm: {
    fontFamily: "Lexend_400Regular",
    fontSize: 14,
    lineHeight: 1.5,
  },
  labelBold: {
    fontFamily: "Lexend_700Bold",
    fontSize: 12,
    lineHeight: 1,
    letterSpacing: 0.05,
  },
  button: {
    fontFamily: "Lexend_600SemiBold",
    fontSize: 16,
    lineHeight: 1,
  },
} as const;

export const rounded = {
  sm: 4,
  md: 8,
  DEFAULT: 16,
  lg: 24,
  xl: 48,
  full: 9999,
} as const;

export const spacing = {
  base: 4,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  containerPadding: 20,
  gutter: 12,
} as const;
