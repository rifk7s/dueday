import { apiFetch } from "./client";
import type { Tag } from "./tags";
import { mockTags } from "./tags";

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
  time_start: string | null;
  time_end: string | null;
  status: "not_started" | "ongoing" | "pending" | "completed";
  progress: number;
  deskripsi: string | null;
  ulangi: UlangiType | null;
  tag: Tag | null;
  created_at: string;
  updated_at: string;
};

export type NewActivity = {
  activity_name: string;
  tanggal?: string;
  time_start?: string;
  time_end?: string;
  id_tag?: number;
  ulangi?: UlangiType;
  deskripsi?: string;
  status?: "not_started" | "ongoing" | "pending" | "completed";
};

export const ULANGI_API_MAP: Partial<Record<string, UlangiType>> = {
  Harian: "setiap_hari",
  Mingguan: "satu_minggu",
  Bulanan: "satu_bulan",
};

export const ULANGI_DISPLAY: Record<UlangiType, string> = {
  setiap_hari: "HARIAN",
  satu_minggu: "MINGGUAN",
  satu_bulan: "BULANAN",
  satu_tahun: "TAHUNAN",
};

const MOCK_API = process.env.EXPO_PUBLIC_MOCK_AUTH === "true";

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
    ulangi: "satu_minggu",
    tag: mockTags[2] ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function generateId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function listActivities(
  token: string | null,
): Promise<Activity[]> {
  if (MOCK_API) return [...mockStore];
  return apiFetch<Activity[]>("/activities", token);
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
  return apiFetch<Activity>(`/activities/${id}`, token);
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
      time_start: input.time_start ?? null,
      time_end: input.time_end ?? null,
      status: input.status ?? "not_started",
      progress: 0,
      deskripsi: input.deskripsi ?? null,
      ulangi: input.ulangi ?? null,
      tag: tagObj,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStore = [...mockStore, activity];
    return activity;
  }
  return apiFetch<Activity>("/activities", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
