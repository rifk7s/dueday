import { apiFetch } from "@/api/client";

export type ReminderStyle = "tegas" | "ngancam_halus" | "santai";
export type ReminderSound = "default" | "chime" | "bell";

export type ReminderSettingsSection = {
  time: string | null;
  message: string | null;
  style: ReminderStyle | null;
  sound: ReminderSound | null;
  vibrate: boolean;
};

export type AllReminderSettings = {
  task: ReminderSettingsSection;
  activity: ReminderSettingsSection;
};

export type UpdateReminderSettingsInput = {
  task?: Partial<ReminderSettingsSection>;
  activity?: Partial<ReminderSettingsSection>;
};

export function getReminderSettings(token: string | null): Promise<AllReminderSettings> {
  return apiFetch<AllReminderSettings>("/me/reminder-settings", token);
}

export function updateReminderSettings(
  input: UpdateReminderSettingsInput,
  token: string | null,
): Promise<AllReminderSettings> {
  return apiFetch<AllReminderSettings>("/me/reminder-settings", token, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
