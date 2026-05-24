import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const REMINDER_CHANNEL_ID = "reminder";

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "Task Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: true },
  });
  return status === "granted";
}

export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export type ScheduleReminderInput = {
  id: string;
  title: string;
  body: string;
  date: Date;
  sound?: string | null;
  vibrate?: boolean | null;
};

/**
 * Schedule a local notification for the given date. Past-dated reminders are
 * skipped (returns null). Caller supplies a deterministic id (e.g.
 * `reminder:<entity_id>:<slot_label>`) so cancellation does not need an FE
 * side-table.
 */
export async function scheduleReminder(input: ScheduleReminderInput): Promise<string | null> {
  if (input.date.getTime() <= Date.now()) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    identifier: input.id,
    content: {
      title: input.title,
      body: input.body,
      sound: input.sound ?? "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: input.date,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
}

export async function cancelReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelManyReminders(notificationIds: readonly string[]): Promise<void> {
  await Promise.allSettled(notificationIds.map((id) => cancelReminder(id)));
}

/**
 * Cancel every scheduled notification whose identifier starts with the given
 * prefix (e.g. `reminder:<entity_id>:` to wipe an entity's slots before
 * re-scheduling).
 */
export async function cancelByIdentifierPrefix(prefix: string): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const matches = all.filter((n) => n.identifier.startsWith(prefix)).map((n) => n.identifier);
  await cancelManyReminders(matches);
}
