import { type Activity } from "@/api/activities";
import { type Task } from "@/api/tasks";
import { type AuthUser } from "@/auth/api";

/**
 * Time buckets, rendered top-to-bottom. The feed mirrors the phone's
 * notification tray: a timeline grouped by when each reminder is relevant
 * ("Hari ini" newest, "Sebelumnya" oldest), not an urgency-badged to-do list.
 */
export type TimeBucket = "today" | "week" | "overdue";

/** Surface the premium-expiry notification only once it's this close (matches the 7/1-day expiry pushes). */
const PREMIUM_WARN_DAYS = 7;

export type NotificationKind = "task" | "activity" | "premium" | "summary";

export type NotificationItem = {
  /** Stable per-entity id used for read/dismiss persistence. */
  id: string;
  kind: NotificationKind;
  bucket: TimeBucket;
  /** Notification title — the entity name, or "Ringkasan Harian" / "Peringatan Langganan". */
  title: string;
  /** The reminder message, phrased like the real push notification. */
  body: string;
  /** Relative time, e.g. "2 jam lalu" / "dalam 4 hari". */
  timeLabel: string;
  /** Sort key within a bucket. */
  sortAt: number;
  /** Source row id for navigation (task/activity only). */
  sourceId?: string;
  /** Premium-only payload for the inline action. */
  premium?: { expired: boolean; subscriptionEnd: string | null };
};

const FAR_FUTURE = new Date(8640000000000000);
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

function isTaskDone(status: Task["status"]): boolean {
  return status === "completed" || status === "completed_late";
}

function isActivityDone(status: Activity["status"]): boolean {
  return status === "completed" || status === "cancelled";
}

function parseDateTime(date: string | null | undefined, time: string | null | undefined): Date | null {
  if (!date) return null;
  const datePart = date.substring(0, 10);
  const timePart = (time ?? "23:59:59").substring(0, 8);
  const parsed = new Date(`${datePart}T${timePart}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sameDay(left: Date, right: Date): boolean {
  return left.toDateString() === right.toDateString();
}

/** Whole-calendar-day distance (ignores clock time). */
function calendarDaysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
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

type EntityInput = {
  kind: "task" | "activity";
  bucket: TimeBucket;
  name: string;
  manualMessage: string | null;
  dueAt: Date;
  hasDate: boolean;
};

/** Friendly nudge text matching the app's reminder tone (see useReminders). */
function defaultBody({ kind, bucket, name, dueAt, hasDate }: EntityInput, now: Date): string {
  if (!hasDate) {
    return kind === "activity"
      ? `${name} belum punya jadwal. Atur waktunya yuk.`
      : `${name} belum punya tenggat. Atur dulu biar nggak lupa.`;
  }
  const rel = relativeTime(dueAt, now);
  if (kind === "activity") {
    if (bucket === "overdue") return `${name} sudah lewat jadwal. Cek lagi yuk.`;
    if (bucket === "today") return `${name} dijadwalkan hari ini. Siap-siap ya.`;
    return `${name} dijadwalkan ${rel}.`;
  }
  if (bucket === "overdue") return `Kirim ${name} sekarang juga, sudah lewat tenggat!`;
  if (bucket === "today") return `Kirim ${name} hari ini, jangan ditunda lagi.`;
  return `${name} jatuh tempo ${rel}. Mulai cicil dari sekarang.`;
}

function entityBucket(dueAt: Date, hasDate: boolean, overdue: boolean, now: Date): TimeBucket {
  if (overdue) return "overdue";
  if (hasDate && sameDay(dueAt, now)) return "today";
  // Everything else upcoming (including undated and far-future) lands here.
  return "week";
}

function makeEntityItem(
  kind: "task" | "activity",
  sourceId: string,
  name: string,
  manualMessage: string | null,
  dueAt: Date,
  hasDate: boolean,
  overdue: boolean,
  now: Date,
): NotificationItem {
  const bucket = entityBucket(dueAt, hasDate, overdue, now);
  const input: EntityInput = { kind, bucket, name, manualMessage, dueAt, hasDate };
  return {
    id: `${kind}:${sourceId}`,
    kind,
    bucket,
    title: name,
    body: manualMessage?.trim() ? manualMessage.trim() : defaultBody(input, now),
    timeLabel: hasDate ? relativeTime(dueAt, now) : "Belum dijadwalkan",
    sortAt: dueAt.getTime(),
    sourceId,
  };
}

function buildSummaryItem(now: Date): NotificationItem {
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return {
    id: `summary:${key}`,
    kind: "summary",
    bucket: "today",
    title: "Ringkasan Harian",
    body: "Lihat ringkasan tugas & aktivitasmu hari ini.",
    timeLabel: "Hari ini",
    // Sort to the top of the "today" bucket.
    sortAt: new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(),
  };
}

function buildPremiumItem(user: AuthUser | undefined, now: Date): NotificationItem | null {
  // Only subscribers with a known end date ever get a premium notification.
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
      premium: { expired: true, subscriptionEnd: user.subscription_end },
    };
  }

  return {
    id: `premium:expiry:${idDate}`,
    kind: "premium",
    bucket: days <= 1 ? "today" : "week",
    title: "Peringatan Langganan",
    body: `Langgananmu berakhir ${relativeTime(end, now)} (${formatScheduledTime(end)}). Jadwalkan pengingat biar tidak kelewatan.`,
    timeLabel: relativeTime(end, now),
    sortAt: Number.MAX_SAFE_INTEGER,
    premium: { expired: false, subscriptionEnd: user.subscription_end },
  };
}

/**
 * Merge tasks, activities, the daily summary, and the subscription state into a
 * single time-ordered feed that mirrors the phone's notification tray. Each item
 * carries the friendly reminder message (manual override when set, else a default
 * matching the app's reminder tone). Completed/cancelled entities are excluded.
 */
export function buildNotifications(
  tasks: readonly Task[],
  activities: readonly Activity[],
  user: AuthUser | undefined,
  now: Date,
): NotificationItem[] {
  const items: NotificationItem[] = [];

  for (const task of tasks) {
    if (isTaskDone(task.status)) continue;
    const parsed = parseDateTime(task.date, task.time);
    const dueAt = parsed ?? FAR_FUTURE;
    const overdue = task.is_overdue ?? (task.date ? dueAt.getTime() < now.getTime() : false);
    items.push(makeEntityItem("task", task.id, task.task_name, task.reminder_message, dueAt, parsed != null, overdue, now));
  }

  for (const activity of activities) {
    if (isActivityDone(activity.status)) continue;
    const parsed = parseDateTime(activity.tanggal, activity.time_start);
    const dueAt = parsed ?? FAR_FUTURE;
    const overdue = parsed != null && dueAt.getTime() < now.getTime();
    items.push(
      makeEntityItem("activity", activity.id, activity.activity_name, activity.reminder_message, dueAt, parsed != null, overdue, now),
    );
  }

  // The daily summary push only fires for subscribers — mirror that in-app.
  if (user?.status === "subscribed") items.push(buildSummaryItem(now));

  const premium = buildPremiumItem(user, now);
  if (premium) items.push(premium);

  return items.sort((a, b) => {
    const rank = BUCKET_RANK[a.bucket] - BUCKET_RANK[b.bucket];
    if (rank !== 0) return rank;
    return a.sortAt - b.sortAt;
  });
}

export function formatScheduledTime(date: Date): string {
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const day = dayNames[date.getDay()] ?? "";
  const month = monthNames[date.getMonth()] ?? "";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${day}, ${date.getDate()} ${month} ${date.getFullYear()} · ${hh}:${mm}`;
}
