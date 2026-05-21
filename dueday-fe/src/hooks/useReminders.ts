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
import { resolveReminderMessage, type ReminderStyle } from "@/lib/reminderMessages";
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

      // Wipe stale local notifications so re-saves don't accumulate.
      await Promise.all([
        cancelByIdentifierPrefix(TASK_PREFIX),
        cancelByIdentifierPrefix(ACTIVITY_PREFIX),
      ]);

      let scheduledCount = 0;
      let skippedPastCount = 0;

      const taskJobs = tasks.filter(isActiveTask).map(async (task) => {
        const slots: ReminderSlot[] = slotsForTask(
          { priority: asPriority(task.priority), date: task.date },
          settings.task.time,
        );
        for (const slot of slots) {
          const body = await resolveReminderMessage({
            entityId: task.id,
            entityName: task.task_name ?? "Tugas",
            entityDeadline: task.date ?? null,
            slotLabel: slot.slotLabel,
            style: asStyle(settings.task.style),
            manualOverride: settings.task.message,
            isSubscribed,
            token,
          });
          const id = await scheduleReminder({
            id: `${TASK_PREFIX}${task.id}:${slot.slotLabel}`,
            title: task.task_name ?? "Tugas",
            body,
            date: slot.fireAt,
            sound: settings.task.sound,
            vibrate: settings.task.vibrate,
          });
          if (id) scheduledCount += 1;
          else skippedPastCount += 1;
        }
      });

      const activityJobs = activities.filter(isActiveActivity).map(async (activity) => {
        const slots: ReminderSlot[] = slotsForActivity(
          { tanggal: activity.tanggal },
          settings.activity.time,
        );
        for (const slot of slots) {
          const body = await resolveReminderMessage({
            entityId: activity.id,
            entityName: activity.activity_name ?? "Aktivitas",
            entityDeadline: activity.tanggal ?? null,
            slotLabel: slot.slotLabel,
            style: asStyle(settings.activity.style),
            manualOverride: settings.activity.message,
            isSubscribed,
            token,
          });
          const id = await scheduleReminder({
            id: `${ACTIVITY_PREFIX}${activity.id}:${slot.slotLabel}`,
            title: activity.activity_name ?? "Aktivitas",
            body,
            date: slot.fireAt,
            sound: settings.activity.sound,
            vibrate: settings.activity.vibrate,
          });
          if (id) scheduledCount += 1;
          else skippedPastCount += 1;
        }
      });

      await Promise.all([...taskJobs, ...activityJobs]);

      return { settings, permissionGranted: true, scheduledCount, skippedPastCount };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminder-settings"] });
    },
  });
}
