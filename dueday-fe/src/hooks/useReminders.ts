import type { Activity } from "@/api/activities";
import { listActivities } from "@/api/activities";
import {
    getReminderSettings,
    updateReminderSettings,
    type AllReminderSettings,
    type UpdateReminderSettingsInput,
} from "@/api/reminders";
import type { Task } from "@/api/tasks";
import { listTasks } from "@/api/tasks";
import { useSession } from "@/auth/ctx";
import { getCurrentUser } from "@/auth/me";
import {
    cancelByIdentifierPrefix,
    ensureAndroidChannel,
    ensureNotificationPermission,
    REMINDER_CHANNEL_ID,
    scheduleReminder,
} from "@/lib/notifications";
import { resolveReminderMessages, type ReminderStyle, type SlotInput } from "@/lib/reminderMessages";
import {
    slotsForActivity,
    slotsForTask,
    type Priority,
    type ReminderSlot,
} from "@/lib/reminderSchedule";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";

export function useReminderSettingsQuery() {
  const { token } = useSession();
  return useQuery<AllReminderSettings>({
    queryKey: ["reminder-settings"],
    queryFn: () => getReminderSettings(token),
    enabled: !!token,
    staleTime: 60 * 1000,
  });
}

export type FireTimeSummary = {
  scheduledCount: number;
  firstFireAt: Date | null;
  lastFireAt: Date | null;
};

export type SyncResult = {
  settings: AllReminderSettings;
  permissionGranted: boolean;
  scheduledCount: number;
  skippedPastCount: number;
  firstFireAt: Date | null;
  lastFireAt: Date | null;
  task: FireTimeSummary;
  activity: FireTimeSummary;
};

const TASK_PREFIX = "reminder:task:";
const ACTIVITY_PREFIX = "reminder:activity:";
const PREMIUM_PREFIX = "reminder:premium:";

function isActiveTask(t: Task): boolean {
  return t.status !== "completed" && t.status !== "completed_late";
}

function isActiveActivity(a: Activity): boolean {
  return a.status !== "completed" && a.status !== "cancelled";
}

function asPriority(p: string | null | undefined): Priority | null {
  if (p === "low" || p === "medium" || p === "high") return p;
  return null;
}

function asStyle(s: string | null | undefined): ReminderStyle | null {
  if (s === "tegas" || s === "ngancam_halus" || s === "santai") return s;
  return null;
}

function dueState(dateStr: string | null | undefined, now: Date): "today" | "overdue" | "other" {
  if (!dateStr) return "other";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "other";
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (day === today) return "today";
  if (day < today) return "overdue";
  return "other";
}

/**
 * Concrete daily-summary line so the notification is actionable instead of a
 * generic "lihat ringkasan". Counts incomplete items due today and already
 * overdue — recomputed every time reminders re-sync.
 */
function buildDailySummaryBody(tasks: Task[], activities: Activity[], now: Date): string {
  let dueToday = 0;
  let overdue = 0;
  const tally = (state: "today" | "overdue" | "other") => {
    if (state === "today") dueToday++;
    else if (state === "overdue") overdue++;
  };
  for (const t of tasks.filter(isActiveTask)) tally(dueState(t.date, now));
  for (const a of activities.filter(isActiveActivity)) tally(dueState(a.tanggal, now));

  if (dueToday === 0 && overdue === 0) {
    return "Tidak ada yang jatuh tempo hari ini. Mantap, jaga terus ritmemu!";
  }
  const parts: string[] = [];
  if (dueToday > 0) parts.push(`${dueToday} jatuh tempo hari ini`);
  if (overdue > 0) parts.push(`${overdue} sudah terlambat`);
  return `${parts.join(", ")}. Selesaikan sekarang sebelum menumpuk.`;
}

function summarizeFireTimes(fireTimes: Date[]): FireTimeSummary {
  const sorted = [...fireTimes].sort((a, b) => a.getTime() - b.getTime());
  return {
    scheduledCount: sorted.length,
    firstFireAt: sorted[0] ?? null,
    lastFireAt: sorted.at(-1) ?? null,
  };
}

type PendingJob = {
  identifier: string;
  title: string;
  slotKey: string;
  fireAt: Date;
  sound: string | null;
  vibrate: boolean;
};

function buildTaskJobs(
  tasks: Task[],
  settings: AllReminderSettings,
  isSubscribed: boolean,
): { jobs: PendingJob[]; slots: SlotInput[] } {
  const jobs: PendingJob[] = [];
  const slots: SlotInput[] = [];
  const style = asStyle(settings.task.style);

  for (const task of tasks.filter(isActiveTask)) {
    const taskSlots: ReminderSlot[] = slotsForTask(
      { priority: asPriority(task.priority), date: task.date },
      settings.task.time,
    );
    const title = task.task_name ?? "Tugas";
    for (const slot of taskSlots) {
      const slotKey = `${task.id}:${slot.slotLabel}`;
      slots.push({
        entityId: task.id,
        entityName: title,
        entityDeadline: task.date ?? null,
        slotLabel: slot.slotLabel,
        style,
        manualOverride: settings.task.message,
        isSubscribed,
      });
      jobs.push({
        identifier: `${TASK_PREFIX}${slotKey}`,
        title,
        slotKey,
        fireAt: slot.fireAt,
        sound: settings.task.sound,
        vibrate: settings.task.vibrate,
      });
    }
  }
  return { jobs, slots };
}

function buildActivityJobs(
  activities: Activity[],
  settings: AllReminderSettings,
  isSubscribed: boolean,
): { jobs: PendingJob[]; slots: SlotInput[] } {
  const jobs: PendingJob[] = [];
  const slots: SlotInput[] = [];
  const style = asStyle(settings.activity.style);

  for (const activity of activities.filter(isActiveActivity)) {
    const activitySlots: ReminderSlot[] = slotsForActivity(
      { tanggal: activity.tanggal },
      settings.activity.time,
    );
    const title = activity.activity_name ?? "Aktivitas";
    for (const slot of activitySlots) {
      const slotKey = `${activity.id}:${slot.slotLabel}`;
      slots.push({
        entityId: activity.id,
        entityName: title,
        entityDeadline: activity.tanggal ?? null,
        slotLabel: slot.slotLabel,
        style,
        manualOverride: settings.activity.message,
        isSubscribed,
      });
      jobs.push({
        identifier: `${ACTIVITY_PREFIX}${slotKey}`,
        title,
        slotKey,
        fireAt: slot.fireAt,
        sound: settings.activity.sound,
        vibrate: settings.activity.vibrate,
      });
    }
  }
  return { jobs, slots };
}

export async function syncReminderNotifications(token: string | null): Promise<SyncResult> {
  const settings = await getReminderSettings(token);

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) {
    const empty: FireTimeSummary = { scheduledCount: 0, firstFireAt: null, lastFireAt: null };
    return {
      settings,
      permissionGranted: false,
      scheduledCount: 0,
      skippedPastCount: 0,
      firstFireAt: null,
      lastFireAt: null,
      task: empty,
      activity: empty,
    };
  }

  await ensureAndroidChannel();

  const [tasks, activities, user] = await Promise.all([
    listTasks(token),
    listActivities(token),
    getCurrentUser(token).catch(() => null),
  ]);
  const isSubscribed = user?.status === "subscribed";

  // Cancel existing scheduled reminders for tasks, activities, and premium
  await Promise.all([
    cancelByIdentifierPrefix(TASK_PREFIX),
    cancelByIdentifierPrefix(ACTIVITY_PREFIX),
    cancelByIdentifierPrefix(PREMIUM_PREFIX),
  ]);

  const taskPlan = buildTaskJobs(tasks, settings, isSubscribed);
  const activityPlan = buildActivityJobs(activities, settings, isSubscribed);
  const allJobs = [...taskPlan.jobs, ...activityPlan.jobs];

  // ONE batched server call resolves all slot bodies (with FE + BE cache,
  // pulse-2 dedup, and template fallback for misses).
  const bodyByKey = await resolveReminderMessages([...taskPlan.slots, ...activityPlan.slots], token);

  const results = await Promise.all(
    allJobs.map((job) =>
      scheduleReminder({
        id: job.identifier,
        title: job.title,
        body: bodyByKey[job.slotKey] ?? job.title,
        date: job.fireAt,
        sound: job.sound,
        vibrate: job.vibrate,
      }),
    ),
  );

  // Premium scheduling: daily summary + optional expiry warnings
  try {
    if (isSubscribed) {
      // Determine preferred daily time: prefer task time, then activity time, then 08:00
      const timeStr = settings.task.time ?? settings.activity.time ?? "08:00";
      const [hh, mm] = timeStr.split(":").map((s) => parseInt(s, 10));
      const hour = Number.isFinite(hh) ? hh : 8;
      const minute = Number.isFinite(mm) ? mm : 0;

      // Schedule a repeating daily summary at the chosen hour/minute
      // Use deterministic id so we can cancel by prefix later.
      const dailyId = `${PREMIUM_PREFIX}daily`;

      const dailyTrigger: Notifications.DailyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: REMINDER_CHANNEL_ID,
      };

      await Notifications.scheduleNotificationAsync({
        identifier: dailyId,
        content: {
          title: "Ringkasan Harian",
          body: buildDailySummaryBody(tasks, activities, new Date()),
          sound: "default",
        },
        trigger: dailyTrigger,
      });

      const subEndRaw = user?.subscription_end ?? null;
      if (subEndRaw) {
        const subEnd = new Date(subEndRaw);
        if (!isNaN(subEnd.getTime())) {
          const warnOffsets = [7, 1]; // days before expiry
          for (const daysBefore of warnOffsets) {
            const warnAt = new Date(subEnd.getTime() - daysBefore * 24 * 60 * 60 * 1000);
            if (warnAt.getTime() > Date.now()) {
              const key = `${PREMIUM_PREFIX}expiry:${subEnd.toISOString().slice(0, 10)}:${daysBefore}`;
              // Reuse scheduleReminder for single-date reminders
              await scheduleReminder({
                id: key,
                title: "Peringatan Langganan",
                body: `Langgananmu berakhir dalam ${daysBefore} hari. Periksa langgananmu.`,
                date: warnAt,
              });
            }
          }
        }
      }
    }
  } catch (e) {
    // Swallow premium scheduling errors — scheduling best-effort only.
    // Keep main result unaffected.
    // eslint-disable-next-line no-console
    console.warn("premium scheduling failed", e);
  }

  const taskFireTimes: Date[] = [];
  const activityFireTimes: Date[] = [];
  const taskJobCount = taskPlan.jobs.length;
  results.forEach((id, idx) => {
    if (id == null) return;
    const fireAt = allJobs[idx].fireAt;
    if (idx < taskJobCount) taskFireTimes.push(fireAt);
    else activityFireTimes.push(fireAt);
  });

  const task = summarizeFireTimes(taskFireTimes);
  const activity = summarizeFireTimes(activityFireTimes);
  const scheduledCount = task.scheduledCount + activity.scheduledCount;
  const skippedPastCount = results.length - scheduledCount;
  const allSorted = [...taskFireTimes, ...activityFireTimes].sort((a, b) => a.getTime() - b.getTime());

  return {
    settings,
    permissionGranted: true,
    scheduledCount,
    skippedPastCount,
    firstFireAt: allSorted[0] ?? null,
    lastFireAt: allSorted.at(-1) ?? null,
    task,
    activity,
  };
}

// Coalesces a burst of task/activity CRUDs into a single sync. Each sync
// re-fetches settings/tasks/activities/me + reschedules everything, so firing
// it on every keystroke (e.g. toggling 5 tasks done in a row) thrashes the BE.
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingToken: string | null = null;

export function scheduleSyncReminderNotifications(token: string | null, delayMs = 800): void {
  pendingToken = token;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    const t = pendingToken;
    pendingToken = null;
    void syncReminderNotifications(t).catch(() => null);
  }, delayMs);
}

/**
 * PUT reminder settings, then re-schedule all local notifications for active
 * tasks & activities from the new globals. The BE persists nothing per-slot.
 *
 * Returns counts so the caller can show a "12 reminder dijadwalkan" toast.
 */
export function useUpdateReminderSettingsMutation() {
  const { token } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateReminderSettingsInput): Promise<SyncResult> => {
      await updateReminderSettings(input, token);
      return syncReminderNotifications(token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminder-settings"] });
    },
  });
}
