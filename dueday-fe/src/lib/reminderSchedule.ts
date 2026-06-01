/**
 * Compute reminder slot fire-times for a task/activity using global user settings.
 * Pure TypeScript port of the (priority, deadline-bucket) calendar logic that
 * used to live in the Laravel backend; running it on-device avoids per-slot
 * DB rows server-side.
 */

export type Priority = "low" | "medium" | "high";

export type ReminderSlot = {
  slotLabel: string;
  fireAt: Date;
};

const SECOND_PULSE_OFFSET_MINUTES = 30;

function parseTime(hhmm: string | null | undefined): [number, number] {
  const fallback: [number, number] = [9, 0];
  if (!hhmm) return fallback;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return fallback;
  const h = Math.max(0, Math.min(23, parseInt(m[1], 10)));
  const min = Math.max(0, Math.min(59, parseInt(m[2], 10)));
  return [h, min];
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function diffInDays(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86400000);
}

function setTimeOfDay(d: Date, h: number, m: number): Date {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x;
}

/**
 * Reminder cadence as "days before the deadline" to fire on, per priority.
 * Reminders get denser as the deadline approaches and ALWAYS include the day
 * before (1) and the day of (0). Higher priority = earlier and more frequent
 * nagging.
 *
 * NOTE: iOS keeps only the 64 soonest-firing pending notifications per app, so
 * many high-priority tasks at once can drop the farthest-out reminders.
 */
const OFFSETS_BY_PRIORITY: Record<Priority, readonly number[]> = {
  high: [0, 1, 2, 3, 4, 5, 6, 7, 10, 12, 14],
  medium: [0, 1, 2, 3, 5, 7, 11],
  low: [0, 1, 3, 7],
};

// Days (offset-before-deadline) that fire a second +30min ping, per priority.
// High doubles up on its 3 most urgent days; medium doubles only on the deadline.
const DOUBLE_PING_OFFSETS: Record<Priority, ReadonlySet<number>> = {
  high: new Set([0, 1, 2]),
  medium: new Set([0]),
  low: new Set(),
};

function slotLabelFor(offset: number, isKickOff: boolean): string {
  if (offset === 0) return "h-hari";
  if (isKickOff) return "kick-off";
  return `h-minus-${offset}`;
}

/**
 * Build reminder slots for a task that has a `priority` + `date` deadline.
 * Escalating cadence (see OFFSETS_BY_PRIORITY) plus an immediate kick-off so
 * the task is acknowledged the moment it's scheduled. Empty only when data is
 * incomplete or the deadline already passed.
 */
export function slotsForTask(
  input: { priority: Priority | null | undefined; date: string | Date | null | undefined },
  globalTime: string | null | undefined,
  now: Date = new Date(),
): ReminderSlot[] {
  if (!input.priority || !input.date) return [];
  const deadline = startOfDay(new Date(input.date));
  if (Number.isNaN(deadline.getTime())) return [];
  const nowStart = startOfDay(now);
  const daysUntil = diffInDays(nowStart, deadline);
  if (daysUntil < 0) return [];

  const priority = input.priority.toLowerCase() as Priority;
  const baseOffsets = OFFSETS_BY_PRIORITY[priority] ?? OFFSETS_BY_PRIORITY.medium;
  const [hour, minute] = parseTime(globalTime);

  // Offsets within range, plus a kick-off today so far-out tasks aren't silent
  // until their first scheduled nag.
  const offsets = new Set<number>(baseOffsets.filter((off) => off <= daysUntil));
  offsets.add(daysUntil);

  const slots: ReminderSlot[] = [];
  // Furthest-out (today) first so the feed reads chronologically. Every slot is
  // a fixed wall-clock time, so re-syncing reschedules identical times (no
  // duplicates) and any slot whose time already passed is simply skipped.
  for (const offset of [...offsets].sort((a, b) => b - a)) {
    const isKickOff = offset === daysUntil && !baseOffsets.includes(offset);
    const label = slotLabelFor(offset, isKickOff);
    const fireAt = setTimeOfDay(addDays(deadline, -offset), hour, minute);
    slots.push({ slotLabel: label, fireAt });
    // Some days fire a second ping 30 min later (per priority, see DOUBLE_PING_OFFSETS).
    if (DOUBLE_PING_OFFSETS[priority]?.has(offset)) {
      slots.push({ slotLabel: `${label}-pulse-2`, fireAt: new Date(fireAt.getTime() + SECOND_PULSE_OFFSET_MINUTES * 60_000) });
    }
  }
  return slots;
}

/**
 * Activity reminder slots keyed off the activity's `tanggal`. Like tasks, an
 * activity always gets a day-before and day-of reminder, plus a kick-off today
 * when it's still days away. All fixed wall-clock times (no duplicate-on-resync).
 */
export function slotsForActivity(
  input: { tanggal: string | Date | null | undefined },
  globalTime: string | null | undefined,
  now: Date = new Date(),
): ReminderSlot[] {
  if (!input.tanggal) return [];
  const target = startOfDay(new Date(input.tanggal));
  if (Number.isNaN(target.getTime())) return [];
  const nowStart = startOfDay(now);
  const daysUntil = diffInDays(nowStart, target);
  if (daysUntil < 0) return [];

  const [hour, minute] = parseTime(globalTime);
  const offsets = new Set<number>([0, 1].filter((off) => off <= daysUntil));
  offsets.add(daysUntil); // kick-off today

  const slots: ReminderSlot[] = [];
  for (const offset of [...offsets].sort((a, b) => b - a)) {
    const isKickOff = offset === daysUntil && offset !== 0 && offset !== 1;
    const fireAt = setTimeOfDay(addDays(target, -offset), hour, minute);
    slots.push({ slotLabel: slotLabelFor(offset, isKickOff), fireAt });
  }
  return slots;
}
