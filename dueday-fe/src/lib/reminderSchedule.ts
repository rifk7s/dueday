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

type DateEntry = { date: Date; slotLabel: string };

function highFar(now: Date, deadline: Date): DateEntry[] {
  const dates: DateEntry[] = [{ date: now, slotLabel: "kick-off" }];
  let cursor = addDays(now, 2);
  while (cursor.getTime() <= deadline.getTime()) {
    dates.push({ date: cursor, slotLabel: "reminder" });
    cursor = addDays(cursor, 2);
  }
  return dates;
}

function everyDay(now: Date, deadline: Date): DateEntry[] {
  const dates: DateEntry[] = [];
  let cursor = now;
  while (cursor.getTime() <= deadline.getTime()) {
    dates.push({ date: cursor, slotLabel: "harian" });
    cursor = addDays(cursor, 1);
  }
  return dates;
}

function everyN(now: Date, deadline: Date, n: number, label: string): DateEntry[] {
  const dates: DateEntry[] = [];
  let cursor = now;
  while (cursor.getTime() <= deadline.getTime()) {
    dates.push({ date: cursor, slotLabel: label });
    cursor = addDays(cursor, n);
  }
  return dates;
}

function midpoint(now: Date, deadline: Date): DateEntry[] {
  const days = diffInDays(now, deadline);
  return [{ date: addDays(now, Math.floor(days / 2)), slotLabel: "tengah-rentang" }];
}

function lowNear(now: Date, deadline: Date): DateEntry[] {
  const dates: DateEntry[] = [];
  const hMinus1 = addDays(deadline, -1);
  if (hMinus1.getTime() >= now.getTime()) {
    dates.push({ date: hMinus1, slotLabel: "h-minus-1" });
  }
  dates.push({ date: deadline, slotLabel: "h-hari" });
  return dates;
}

function datesFor(priority: Priority, bucket: "far" | "mid" | "near", now: Date, deadline: Date): DateEntry[] {
  const key = `${priority}-${bucket}`;
  switch (key) {
    case "high-far":
      return highFar(now, deadline);
    case "high-mid":
    case "high-near":
      return everyDay(now, deadline);
    case "medium-far":
      return everyN(now, deadline, 5, "tiap-5-hari");
    case "medium-mid":
      return everyN(now, deadline, 2, "tiap-2-hari");
    case "medium-near":
      return everyDay(now, deadline);
    case "low-far":
      return [];
    case "low-mid":
      return midpoint(now, deadline);
    case "low-near":
      return lowNear(now, deadline);
    default:
      return [];
  }
}

/**
 * Build reminder slots for a task that has a `priority` + `date` deadline.
 * Returns empty list if data is incomplete or deadline already passed.
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
  const days = diffInDays(nowStart, deadline);
  if (days < 0) return [];

  const bucket: "far" | "mid" | "near" = days > 7 ? "far" : days >= 3 ? "mid" : "near";
  const priority = input.priority.toLowerCase() as Priority;
  const [hour, minute] = parseTime(globalTime);
  const dates = datesFor(priority, bucket, nowStart, deadline);
  const doublePulse = priority === "high" && bucket === "near";

  const slots: ReminderSlot[] = [];
  for (const entry of dates) {
    const primary = setTimeOfDay(entry.date, hour, minute);
    slots.push({ slotLabel: entry.slotLabel, fireAt: primary });
    if (doublePulse) {
      const pulse2 = new Date(primary.getTime() + SECOND_PULSE_OFFSET_MINUTES * 60_000);
      slots.push({ slotLabel: `${entry.slotLabel}-pulse-2`, fireAt: pulse2 });
    }
  }
  return slots;
}

/**
 * Activity reminder slots follow a simpler schedule keyed off the activity's
 * `tanggal` (date) and a global time. One reminder per activity occurrence at
 * the configured time, with an extra h-minus-1 pulse if the activity is more
 * than a day away.
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
  const days = diffInDays(nowStart, target);
  if (days < 0) return [];

  const [hour, minute] = parseTime(globalTime);
  const slots: ReminderSlot[] = [];
  if (days >= 1) {
    slots.push({ slotLabel: "h-minus-1", fireAt: setTimeOfDay(addDays(target, -1), hour, minute) });
  }
  slots.push({ slotLabel: "h-hari", fireAt: setTimeOfDay(target, hour, minute) });
  return slots;
}
