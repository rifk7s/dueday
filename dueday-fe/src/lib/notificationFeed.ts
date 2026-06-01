import { type AuthUser } from "@/auth/api";
import { type DeliveredNotification } from "@/lib/notificationHistory";

/**
 * Time buckets, rendered top-to-bottom. The feed mirrors the phone's
 * notification tray: delivered reminders grouped by when they arrived
 * ("Hari ini" newest, "Sebelumnya" oldest).
 */
export type TimeBucket = "today" | "week" | "overdue";

export type NotificationKind = "task" | "activity" | "premium" | "summary";

export type NotificationItem = {
  /** Stable id used for read/dismiss persistence (the delivery's unique key). */
  id: string;
  kind: NotificationKind;
  bucket: TimeBucket;
  /** Notification title, straight from the delivered push. */
  title: string;
  /** The delivered reminder message. */
  body: string;
  /** Relative time, e.g. "26 mnt lalu". */
  timeLabel: string;
  /** Sort key within a bucket (delivery timestamp). */
  sortAt: number;
  /** Source row id for navigation (task/activity only). */
  sourceId?: string;
};

const BUCKET_RANK: Record<TimeBucket, number> = { today: 0, week: 1, overdue: 2 };

export const BUCKET_ORDER: readonly TimeBucket[] = ["today", "week", "overdue"];

export function bucketLabel(bucket: TimeBucket): string {
  switch (bucket) {
    case "today":
      return "Hari ini";
    case "week":
      return "Minggu ini";
    case "overdue":
      return "Sebelumnya";
  }
}

function sameDay(left: Date, right: Date): boolean {
  return left.toDateString() === right.toDateString();
}

/** "dalam 3 jam" / "2 hari lalu" — phone-tray style relative time. */
export function relativeTime(target: Date, now: Date): string {
  const diff = target.getTime() - now.getTime();
  const past = diff < 0;
  const abs = Math.abs(diff);
  const MIN = 60_000;
  const HOUR = 3_600_000;
  const DAY = 86_400_000;

  let label: string;
  if (abs < HOUR) label = `${Math.max(1, Math.round(abs / MIN))} mnt`;
  else if (abs < DAY) label = `${Math.round(abs / HOUR)} jam`;
  else label = `${Math.round(abs / DAY)} hari`;

  return past ? `${label} lalu` : `dalam ${label}`;
}

/** Bucket a delivered notification by how long ago it arrived. */
function deliveryBucket(deliveredAt: Date, now: Date): TimeBucket {
  if (sameDay(deliveredAt, now)) return "today";
  const WEEK = 7 * 86_400_000;
  if (now.getTime() - deliveredAt.getTime() <= WEEK) return "week";
  return "overdue";
}

/**
 * Map the persisted delivered-notification log into the time-grouped feed that
 * mirrors the phone's notification tray. Newest deliveries sort first within
 * each bucket.
 */
export function buildDeliveredNotifications(
  delivered: readonly DeliveredNotification[],
  now: Date,
): NotificationItem[] {
  const items: NotificationItem[] = delivered.map((entry) => {
    const deliveredAt = new Date(entry.deliveredAt);
    return {
      id: entry.key,
      kind: entry.kind,
      bucket: deliveryBucket(deliveredAt, now),
      title: entry.title,
      body: entry.body,
      timeLabel: relativeTime(deliveredAt, now),
      sortAt: entry.deliveredAt,
      sourceId: entry.sourceId,
    };
  });

  return items.sort((a, b) => {
    const rank = BUCKET_RANK[a.bucket] - BUCKET_RANK[b.bucket];
    if (rank !== 0) return rank;
    // Newest first within a bucket.
    return b.sortAt - a.sortAt;
  });
}

/** Surface the premium-expiry notification only once it's this close (matches the 7/1-day expiry pushes). */
const PREMIUM_WARN_DAYS = 7;

/** Whole-calendar-day distance (ignores clock time). */
function calendarDaysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function formatScheduledTime(date: Date): string {
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const day = dayNames[date.getDay()] ?? "";
  const month = monthNames[date.getMonth()] ?? "";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${day}, ${date.getDate()} ${month} ${date.getFullYear()} · ${hh}:${mm}`;
}

/**
 * Synthesize the premium subscription notification from live subscription state
 * (not from delivered history) so the warning is visible *before* the scheduled
 * push fires. Pinned to the top of "Hari ini". Returns null when the user isn't
 * a subscriber or expiry is still far off.
 */
export function buildPremiumItem(user: AuthUser | undefined, now: Date): NotificationItem | null {
  if (!user || user.status !== "subscribed" || !user.subscription_end) return null;

  const end = new Date(user.subscription_end);
  if (Number.isNaN(end.getTime())) return null;

  const expired = end.getTime() <= now.getTime();
  const days = calendarDaysBetween(now, end);
  // Stay quiet until expiry is near; only surface within the warning window or once expired.
  if (!expired && days > PREMIUM_WARN_DAYS) return null;

  const idDate = user.subscription_end.slice(0, 10);

  if (expired) {
    return {
      id: `premium:expired:${idDate}`,
      kind: "premium",
      bucket: "today",
      title: "Langganan Berakhir",
      body: `Langganan premium-mu sudah berakhir (${formatScheduledTime(end)}). Perpanjang untuk lanjut menikmati fitur premium.`,
      timeLabel: relativeTime(end, now),
      sortAt: Number.MAX_SAFE_INTEGER,
    };
  }

  return {
    id: `premium:expiry:${idDate}`,
    kind: "premium",
    bucket: "today",
    title: "Peringatan Langganan",
    body: `Langgananmu berakhir ${relativeTime(end, now)} (${formatScheduledTime(end)}). Jadwalkan pengingat biar tidak kelewatan.`,
    timeLabel: relativeTime(end, now),
    sortAt: Number.MAX_SAFE_INTEGER,
  };
}
