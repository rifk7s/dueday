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

export function useReminderSettingsQuery() {
  const { token } = useSession();
  return useQuery<AllReminderSettings>({
    queryKey: ["reminder-settings"],
    queryFn: () => getReminderSettings(token),
    enabled: !!token,
    staleTime: 60 * 1000,
  });
}

export type SyncResult = {
  settings: AllReminderSettings;
  permissionGranted: boolean;
  scheduledCount: number;
  skippedPastCount: number;
};

const TASK_PREFIX = "reminder:task:";
const ACTIVITY_PREFIX = "reminder:activity:";

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
      const settings = await updateReminderSettings(input, token);

      const permissionGranted = await ensureNotificationPermission();
      if (!permissionGranted) {
        return { settings, permissionGranted: false, scheduledCount: 0, skippedPastCount: 0 };
      }
      await ensureAndroidChannel();

      const [tasks, activities, user] = await Promise.all([
        listTasks(token),
        listActivities(token),
        getCurrentUser(token).catch(() => null),
      ]);
      const isSubscribed = user?.status === "subscribed";

      await Promise.all([
        cancelByIdentifierPrefix(TASK_PREFIX),
        cancelByIdentifierPrefix(ACTIVITY_PREFIX),
      ]);

      const taskPlan = buildTaskJobs(tasks, settings, isSubscribed);
      const activityPlan = buildActivityJobs(activities, settings, isSubscribed);
      const allJobs = [...taskPlan.jobs, ...activityPlan.jobs];

      // ONE batched server call resolves all slot bodies (with FE + BE cache,
      // pulse-2 dedup, and template fallback for misses).
      const bodyByKey = await resolveReminderMessages(
        [...taskPlan.slots, ...activityPlan.slots],
        token,
      );

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
      const scheduledCount = results.filter((id) => id != null).length;
      const skippedPastCount = results.length - scheduledCount;

      return { settings, permissionGranted: true, scheduledCount, skippedPastCount };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminder-settings"] });
    },
  });
}
