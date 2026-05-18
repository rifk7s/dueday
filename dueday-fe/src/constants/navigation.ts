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
 * Exit a modal flow (premium / payment / create-*) back to a base route.
 *
 * Use this at the END of a flow instead of `router.replace(...)`. On iOS the
 * flow screens are presented as `presentation: "modal"`, so `router.replace`
 * swaps the route *inside* the modal container — the destination renders stuck
 * in a sheet (the #52/#53 symptom). `dismissTo` tears the whole modal stack
 * down and lands on `target` with the correct native dismiss animation. On a
 * deep-link entry (nothing to dismiss) it falls back to a plain replace.
 */
export function exitFlowTo(target: Href): void {
  if (router.canDismiss()) {
    router.dismissTo(target);
  } else {
    router.replace(target);
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
 * Modal / flow transition for forms and flows (create-*, premium, payment).
 *
 * iOS: card sheet that slides up and can be swiped down to dismiss.
 * Android: NOT a native modal. `presentation: "modal"` on Android hosts the
 * screen in a separate window, which (a) breaks `useSafeAreaInsets()` (top
 * collapses to 0 → content under the notch) and (b) fights the explicit
 * `slide_from_bottom` with the platform modal animation (janky). So on Android
 * these are plain cards that slide in horizontally like every other screen.
 */
export const modalScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  gestureEnabled: true,
  ...Platform.select({
    ios: {
      presentation: "modal" as const,
      animation: "default" as const,
      fullScreenGestureEnabled: true,
    },
    android: {
      animation: "slide_from_right" as const,
      animationDuration: 250,
    },
    default: {},
  }),
};
