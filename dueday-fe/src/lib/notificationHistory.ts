import { type NotificationKind } from "@/lib/notificationFeed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

const HISTORY_KEY = "notif:history";
/** Cap stored history so the log can't grow unbounded. */
const MAX_ENTRIES = 100;

export type DeliveredNotification = {
  /** `${identifier}::${deliveredAt}` — unique per firing; used for dedupe and read/dismiss state. */
  key: string;
  /** Original notification identifier (e.g. `reminder:task:42:h-hari`); used to derive kind/source. */
  identifier: string;
  title: string;
  body: string;
  /** Epoch milliseconds the notification was delivered. */
  deliveredAt: number;
  kind: NotificationKind;
  /** Task/activity id for navigation (when derivable from the identifier). */
  sourceId?: string;
};

/**
 * Derive the notification kind + source entity from a reminder identifier.
 * Identifiers are minted by useReminders: `reminder:task:<id>:<slot>`,
 * `reminder:activity:<id>:<slot>`, `reminder:premium:daily`,
 * `reminder:premium:expiry:<date>:<n>`. Anything else (e.g. a manual test
 * push) renders as a plain card with no navigation target.
 */
export function parseReminderId(identifier: string): { kind: NotificationKind; sourceId?: string } {
  const parts = identifier.split(":");
  if (parts[0] !== "reminder") return { kind: "task" };

  switch (parts[1]) {
    case "task":
      return { kind: "task", sourceId: parts[2] };
    case "activity":
      return { kind: "activity", sourceId: parts[2] };
    case "premium":
      return { kind: parts[2] === "daily" ? "summary" : "premium" };
    default:
      return { kind: "task" };
  }
}

// In-memory cache is the source of truth once hydrated, so concurrent
// recordDelivered() calls mutate a shared array instead of racing on
// AsyncStorage read-modify-write.
let cache: DeliveredNotification[] | null = null;
let hydrating: Promise<DeliveredNotification[]> | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const cb of listeners) cb();
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

async function hydrate(): Promise<DeliveredNotification[]> {
  if (cache) return cache;
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      cache = raw ? (JSON.parse(raw) as DeliveredNotification[]) : [];
    } catch {
      cache = [];
    } finally {
      hydrating = null;
    }
    return cache ?? [];
  })();
  return hydrating;
}

function persist(): void {
  AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(cache ?? [])).catch(() => null);
}

/**
 * expo-notifications reports the delivery time in epoch seconds on iOS but
 * milliseconds on Android. Normalize to ms: any value that looks like seconds
 * (below ~year 2001 in ms) is scaled up.
 */
function normalizeEpochMs(value: number): number {
  if (!Number.isFinite(value)) return Date.now();
  return value < 1e12 ? value * 1000 : value;
}

/** Record a delivered notification (deduped, capped, persisted). Returns once cached. */
export async function recordDelivered(notification: Notifications.Notification): Promise<void> {
  const { request, date } = notification;
  const data = request.content.data as { type?: string } | undefined;
  // payment-success pushes drive their own Alert in _layout — not part of the feed.
  if (data?.type === "payment-success") return;
  // Premium expiry warnings are surfaced from live subscription state (a synthesized
  // card), so don't also log the scheduled push — it would duplicate that card.
  if (request.identifier.startsWith("reminder:premium:expiry")) return;

  const list = await hydrate();
  const identifier = request.identifier;
  const deliveredAt = typeof date === "number" ? normalizeEpochMs(date) : Date.now();
  const key = `${identifier}::${deliveredAt}`;
  if (list.some((entry) => entry.key === key)) return;

  const { kind, sourceId } = parseReminderId(identifier);
  const entry: DeliveredNotification = {
    key,
    identifier,
    title: request.content.title ?? "Notifikasi",
    body: request.content.body ?? "",
    deliveredAt,
    kind,
    sourceId,
  };

  const next = [entry, ...list].sort((a, b) => b.deliveredAt - a.deliveredAt).slice(0, MAX_ENTRIES);
  cache = next;
  persist();
  notify();
}

/** Pull notifications still sitting in the OS tray into the log (no-op/empty on web & Android <6.0). */
export async function syncPresented(): Promise<void> {
  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    for (const n of presented) await recordDelivered(n);
  } catch {
    // Platform without tray access (web) — ignore.
  }
}

export async function getDelivered(): Promise<DeliveredNotification[]> {
  return hydrate();
}
