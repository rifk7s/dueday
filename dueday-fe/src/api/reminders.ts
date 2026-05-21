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

export type GenerateMessageItem = {
  key: string;
  entity_name: string;
  deadline: string | null;
  style: ReminderStyle;
  slot_label: string;
};

export type GenerateMessagesResponse = {
  messages: Record<string, string>;
};

/**
 * Batch reminder-message generator. One HTTP call, one upstream Gemini call
 * (with cached items served instantly). Items the server couldn't generate
 * are simply missing from the response map — callers should fall back to a
 * local template for those keys.
 */
export function batchGenerateMessages(
  items: GenerateMessageItem[],
  token: string | null,
): Promise<GenerateMessagesResponse> {
  return apiFetch<GenerateMessagesResponse>("/reminders/generate-messages", token, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}
