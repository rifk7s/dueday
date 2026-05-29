import { apiFetch } from "./client";
import type { Tag } from "./tags";
import { mapBackendTagToLegacy, mockTags } from "./tags";

export type UlangiType =
  | "setiap_hari"
  | "satu_minggu"
  | "satu_bulan"
  | "satu_tahun";

export type Activity = {
  id: string;
  user_id: string;
  id_tag: number | null;
  activity_name: string;
  tanggal: string | null;
  anchor_date?: string | null;
  time_start: string | null;
  time_end: string | null;
  status: "not_started" | "ongoing" | "pending" | "completed" | "cancelled";
  progress: number;
  progress_started_at?: string | null;
  deskripsi: string | null;
  reminder_message: string | null;
  reminder_style?: string | null;
  reminder_sound?: string | null;
  reminder_frequency?: "once" | "daily" | "weekly" | null;
  reminder_vibrate?: boolean | null;
  ulangi: UlangiType | null;
  tag: Tag | null;
  created_at: string;
  updated_at: string;
};

type BackendRecurrenceType = "daily" | "weekly" | "monthly" | "yearly";

type BackendActivity = {
  id: string;
  user_id: string;
  tag_id: number | null;
  name: string;
  date: string | null;
  anchor_date?: string | null;
  time_start: string | null;
  time_end: string | null;
  status: "not_started" | "ongoing" | "pending" | "completed" | "cancelled";
  progress: number;
  progress_started_at?: string | null;
  description: string | null;
  reminder_message: string | null;
  reminder_style?: string | null;
  reminder_sound?: string | null;
  reminder_frequency?: "once" | "daily" | "weekly" | null;
  reminder_vibrate?: boolean | null;
  recurrence: BackendRecurrenceType | null;
  tag:
    | {
        id: number;
        name: string;
        created_at: string;
        updated_at: string;
      }
    | null;
  created_at: string;
  updated_at: string;
};

export type NewActivity = {
  activity_name: string;
  tanggal?: string;
  time_start?: string;
  time_end?: string;
  id_tag?: number | null;
  ulangi?: UlangiType;
  deskripsi?: string;
  reminder_message?: string | null;
  reminder_style?: string | null;
  reminder_sound?: string | null;
  reminder_frequency?: "once" | "daily" | "weekly" | null;
  reminder_vibrate?: boolean | null;
  status?: "not_started" | "ongoing" | "pending" | "completed" | "cancelled";
  progress?: number;
  progress_started_at?: string | null;
  ubah_anchor?: boolean;
};

export type UpdateActivity = Partial<NewActivity>;

type BackendActivityPayload = {
  name?: string;
  date?: string;
  time_start?: string;
  time_end?: string;
  tag_id?: number | null;
  recurrence?: BackendRecurrenceType;
  description?: string;
  reminder_message?: string | null;
  reminder_style?: string | null;
  reminder_sound?: string | null;
  reminder_frequency?: "once" | "daily" | "weekly" | null;
  reminder_vibrate?: boolean | null;
  status?: "not_started" | "ongoing" | "pending" | "completed" | "cancelled";
  progress?: number;
  progress_started_at?: string | null;
  ubah_anchor?: boolean;
};

export const ULANGI_API_MAP: Partial<Record<string, UlangiType>> = {
  Harian: "setiap_hari",
  Mingguan: "satu_minggu",
  Bulanan: "satu_bulan",
  Tahunan: "satu_tahun",
};

export const ULANGI_DISPLAY: Record<UlangiType, string> = {
  setiap_hari: "HARIAN",
  satu_minggu: "MINGGUAN",
  satu_bulan: "BULANAN",
  satu_tahun: "TAHUNAN",
};

const MOCK_API = process.env.EXPO_PUBLIC_MOCK_AUTH === "true";

const backendToLegacyRecurrence: Record<BackendRecurrenceType, UlangiType> = {
  daily: "setiap_hari",
  weekly: "satu_minggu",
  monthly: "satu_bulan",
  yearly: "satu_tahun",
};

const legacyToBackendRecurrence: Record<UlangiType, BackendRecurrenceType> = {
  setiap_hari: "daily",
  satu_minggu: "weekly",
  satu_bulan: "monthly",
  satu_tahun: "yearly",
};

let mockStore: Activity[] = [
  {
    id: "mock-activity-seed-1",
    user_id: "1",
    id_tag: 3,
    activity_name: "Rapat Tim DueDay",
    tanggal: "2026-05-14",
    time_start: "13:00:00",
    time_end: "14:00:00",
    status: "not_started",
    progress: 0,
    deskripsi: "Review progress sprint",
    reminder_message: null,
    reminder_style: null,
    reminder_sound: null,
    reminder_frequency: null,
    reminder_vibrate: null,
    ulangi: "satu_minggu",
    tag: mockTags[2] ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function generateId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function mapBackendActivityToLegacy(activity: BackendActivity): Activity {
  return {
    id: activity.id,
    user_id: activity.user_id,
    id_tag: activity.tag_id,
    activity_name: activity.name,
    tanggal: activity.date,
    anchor_date: activity.anchor_date,
    time_start: activity.time_start,
    time_end: activity.time_end,
    status: activity.status,
    progress: activity.progress,
    progress_started_at: activity.progress_started_at,
    deskripsi: activity.description,
    reminder_message: activity.reminder_message,
    reminder_style: activity.reminder_style,
    reminder_sound: activity.reminder_sound,
    reminder_frequency: activity.reminder_frequency,
    reminder_vibrate: activity.reminder_vibrate,
    ulangi: activity.recurrence ? backendToLegacyRecurrence[activity.recurrence] : null,
    tag: activity.tag ? mapBackendTagToLegacy(activity.tag) : null,
    created_at: activity.created_at,
    updated_at: activity.updated_at,
  };
}

function mapLegacyActivityInputToBackendPayload(
  input: Partial<NewActivity>,
): BackendActivityPayload {
  const payload: BackendActivityPayload = {};

  if (input.activity_name !== undefined) payload.name = input.activity_name;
  if (input.tanggal !== undefined) payload.date = input.tanggal;
  if (input.time_start !== undefined) payload.time_start = input.time_start;
  if (input.time_end !== undefined) payload.time_end = input.time_end;
  // Local-only tags carry negative ids and must never reach the backend
  // (tag_id is an unsigned FK). A local selection clears the tag instead.
  if (input.id_tag !== undefined) {
    payload.tag_id = input.id_tag != null && input.id_tag > 0 ? input.id_tag : null;
  }
  if (input.ulangi !== undefined) payload.recurrence = legacyToBackendRecurrence[input.ulangi];
  if (input.deskripsi !== undefined) payload.description = input.deskripsi;
  if (input.reminder_message !== undefined) payload.reminder_message = input.reminder_message;
  if (input.reminder_style !== undefined) payload.reminder_style = input.reminder_style;
  if (input.reminder_sound !== undefined) payload.reminder_sound = input.reminder_sound;
  if (input.reminder_frequency !== undefined) payload.reminder_frequency = input.reminder_frequency;
  if (input.reminder_vibrate !== undefined) payload.reminder_vibrate = input.reminder_vibrate;
  if (input.status !== undefined) payload.status = input.status;
  if (input.progress !== undefined) payload.progress = input.progress;
  if (input.progress_started_at !== undefined) payload.progress_started_at = input.progress_started_at;
  if (input.ubah_anchor !== undefined) payload.ubah_anchor = input.ubah_anchor;

  return payload;
}

export async function listActivities(
  token: string | null,
): Promise<Activity[]> {
  if (MOCK_API) return [...mockStore];
  const activities = await apiFetch<BackendActivity[]>("/activities", token);
  return activities.map(mapBackendActivityToLegacy);
}

export async function getActivity(
  id: string,
  token: string | null,
): Promise<Activity> {
  if (MOCK_API) {
    const activity = mockStore.find((a) => a.id === id);
    if (!activity) {
      throw new Error(`Activity with id ${id} not found`);
    }
    return activity;
  }
  const activity = await apiFetch<BackendActivity>(`/activities/${id}`, token);
  return mapBackendActivityToLegacy(activity);
}

export async function createActivity(
  input: NewActivity,
  token: string | null,
): Promise<Activity> {
  if (MOCK_API) {
    const tagObj = input.id_tag
      ? (mockTags.find((t) => t.id_tag === input.id_tag) ?? null)
      : null;
    const activity: Activity = {
      id: generateId(),
      user_id: "1",
      id_tag: input.id_tag ?? null,
      activity_name: input.activity_name,
      tanggal: input.tanggal ?? null,
      anchor_date: input.tanggal ?? null,
      time_start: input.time_start ?? null,
      time_end: input.time_end ?? null,
      status: input.status ?? "not_started",
      progress: 0,
      deskripsi: input.deskripsi ?? null,
      reminder_message: null,
      ulangi: input.ulangi ?? null,
      tag: tagObj,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStore = [...mockStore, activity];
    return activity;
  }
  const payload = mapLegacyActivityInputToBackendPayload(input);
  const activity = await apiFetch<BackendActivity>("/activities", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapBackendActivityToLegacy(activity);
}

export async function updateActivity(
  id: string,
  input: UpdateActivity,
  token: string | null,
): Promise<Activity> {
  if (MOCK_API) {
    const existing = mockStore.find((activity) => activity.id === id);
    if (!existing) {
      throw new Error(`Activity with id ${id} not found`);
    }

    const next: Activity = {
      ...existing,
      ...input,
      tag: input.id_tag
        ? (mockTags.find((tag) => tag.id_tag === input.id_tag) ?? existing.tag)
        : existing.tag,
      reminder_message: input.reminder_message ?? existing.reminder_message,
      reminder_style: input.reminder_style ?? existing.reminder_style,
      reminder_sound: input.reminder_sound ?? existing.reminder_sound,
      reminder_frequency: input.reminder_frequency ?? existing.reminder_frequency,
      reminder_vibrate: input.reminder_vibrate ?? existing.reminder_vibrate,
      updated_at: new Date().toISOString(),
    };

    mockStore = mockStore.map((activity) => (activity.id === id ? next : activity));
    return next;
  }

  const payload = mapLegacyActivityInputToBackendPayload(input);
  const activity = await apiFetch<BackendActivity>(`/activities/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapBackendActivityToLegacy(activity);
}

export async function deleteActivity(
  id: string,
  token: string | null,
): Promise<void> {
  if (MOCK_API) {
    const existing = mockStore.find((activity) => activity.id === id);
    if (!existing) {
      throw new Error(`Activity with id ${id} not found`);
    }
    mockStore = mockStore.filter((activity) => activity.id !== id);
    return;
  }

  return apiFetch<void>(`/activities/${id}`, token, {
    method: "DELETE",
  });
}