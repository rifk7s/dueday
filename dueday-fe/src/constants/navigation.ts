import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { router, type Href } from "expo-router";
import { Platform } from "react-native";

/**
 * Go back with the correct (reverse) animation when there is history,
 * otherwise reset to a sensible fallback (e.g. opened via deep link).
 *
 * Use this for back buttons instead of `router.replace(...)` — `replace`
 * plays a forward push animation, which is why "back" felt inverted.
 */
export function goBackOr(fallback: Href): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}

/**
 * Centralized, platform-aware screen transitions for the root Stack.
 *
 * Expo Router v6 uses react-native-screens' native stack (bundled in Expo Go),
 * so these map to real platform animations — no dev build required.
 *
 * Keep ALL transition tuning here. Do not scatter Platform.select across screens.
 */

/** Default push transition: horizontal slide + native swipe-back gesture. */
export const stackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  gestureEnabled: true,
  animation: "slide_from_right",
  ...Platform.select({
    ios: {
      // Swipe-back from anywhere on the screen, not just the left edge.
      fullScreenGestureEnabled: true,
    },
    android: {
      animationDuration: 250,
    },
    default: {},
  }),
};

/**
 * Modal / sheet transition for forms and flows (create-*, premium, payment).
 *
 * iOS: card sheet that slides up and can be swiped down to dismiss.
 * Android: slide up from the bottom.
 */
export const modalScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  gestureEnabled: true,
  presentation: "modal",
  animation: Platform.OS === "ios" ? "default" : "slide_from_bottom",
};

/**
 * Terminal success screen inside the payment modal flow.
 *
 * Same modal host as `modalScreenOptions` so it stays inside the existing
 * native modal (no card/slide mismatch when detail-transfer does
 * `router.replace` into it). Gesture is DISABLED: swiping it away would reveal
 * the half-finished payment stack still mounted underneath — the only exit is
 * the CTA, which calls `dismissAll()` to tear down the whole modal host.
 */
export const successScreenOptions: NativeStackNavigationOptions = {
  ...modalScreenOptions,
  gestureEnabled: false,
};
