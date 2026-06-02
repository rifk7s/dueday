import type { TFunction } from "i18next";

// Translated uppercase badge label for a task's state/priority. Screens compute a
// stable key (so their comparisons stay locale-independent) and call this only at
// render time. Unknown keys fall back to their uppercased selves.
export function badgeLabel(key: string, t: TFunction): string {
  switch (key) {
    case "late":
      return t("common.badgeLate");
    case "done":
      return t("common.badgeDone");
    case "ongoing":
      return t("common.badgeOngoing");
    case "cancelled":
      return t("common.badgeCancelled");
    case "high":
      return t("common.priorityHigh");
    case "medium":
      return t("common.priorityMedium");
    case "low":
      return t("common.priorityLow");
    default:
      return key.toUpperCase();
  }
}

// Sentence-case priority label for the create/edit pickers, keyed by the
// Indonesian option value the screens store ("Tinggi"/"Sedang"/"Rendah").
export function priorityOptionLabel(value: "Tinggi" | "Sedang" | "Rendah", t: TFunction): string {
  switch (value) {
    case "Tinggi":
      return t("common.priorityOptionHigh");
    case "Sedang":
      return t("common.priorityOptionMedium");
    case "Rendah":
      return t("common.priorityOptionLow");
  }
}

// Repeat-option label for the activity create/edit pickers, keyed by the
// Indonesian option value the screens store.
export function repeatOptionLabel(
  value: "Tidak" | "Harian" | "Mingguan" | "Bulanan" | "Tahunan",
  t: TFunction,
): string {
  switch (value) {
    case "Tidak":
      return t("common.repeatNo");
    case "Harian":
      return t("common.repeatDaily");
    case "Mingguan":
      return t("common.repeatWeekly");
    case "Bulanan":
      return t("common.repeatMonthly");
    case "Tahunan":
      return t("common.repeatYearly");
  }
}
