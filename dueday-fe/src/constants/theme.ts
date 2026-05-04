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
} as const;

export const typography = {
  h1: {
    fontFamily: "Lexend",
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 1.2,
    letterSpacing: -0.02,
  },
  h2: {
    fontFamily: "Lexend",
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 1.3,
    letterSpacing: -0.01,
  },
  h3: {
    fontFamily: "Lexend",
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 1.4,
  },
  bodyLg: {
    fontFamily: "Lexend",
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 1.6,
  },
  bodySm: {
    fontFamily: "Lexend",
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 1.5,
  },
  labelBold: {
    fontFamily: "Lexend",
    fontSize: 12,
    fontWeight: "700" as const,
    lineHeight: 1,
    letterSpacing: 0.05,
  },
  button: {
    fontFamily: "Lexend",
    fontSize: 16,
    fontWeight: "600" as const,
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
