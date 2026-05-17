import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Visible BottomNav row height (tap targets), excluding the safe-area inset. */
export const TAB_BAR_HEIGHT = 62;

/**
 * Minimum bottom inset applied even on devices without a system
 * gesture/home area (older Android, devices with hardware buttons).
 */
export const MIN_BOTTOM_INSET = 12;

/**
 * Real bottom safe-area inset, floored at MIN_BOTTOM_INSET.
 * iOS home indicator ≈ 34, Android gesture nav ≈ 24–48, 3-button ≈ 48.
 * Used by BottomNav for its own padding/height.
 */
export function useBottomBarInset(): number {
  const { bottom } = useSafeAreaInsets();
  return Math.max(bottom, MIN_BOTTOM_INSET);
}

/**
 * Total vertical space the floating BottomNav occupies, inset included.
 * Use for scroll `paddingBottom` and FAB offsets on (tabs) screens so
 * content/FAB never sits behind the bar or the home indicator.
 */
export function useBottomBarSpace(): number {
  return TAB_BAR_HEIGHT + useBottomBarInset();
}
