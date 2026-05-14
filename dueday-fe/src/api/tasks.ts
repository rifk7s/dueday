import { apiFetch } from "./client";
import type { Tag } from "./tags";
import { mockTags } from "./tags";

export type GoalPoint = {
  id: number;
  text: string;
  completed: boolean;
};

export type Task = {
  id: string;
  user_id: string;
  id_tag: number | null;
  task_name: string;
  date: string;
  time: string | null;
  priority: string | null;
  status: "ongoing" | "completed";
  source: string | null;
  deskripsi: string | null;
  progress: number;
  goals: string | null;
  goal_points: GoalPoint[] | null;
  tag: Tag | null;
  created_at: string;
  updated_at: string;
};

export type NewTask = {
  task_name: string;
  date: string;
  time?: string;
  priority?: string;
  id_tag?: number;
  goals?: string;
  deskripsi?: string;
  status?: "ongoing" | "completed";
};

export const PRIORITY_API_MAP: Record<string, string> = {
  Tinggi: "high",
  Sedang: "medium",
  Rendah: "low",
};

export const PRIORITY_DISPLAY: Record<string, string> = {
  high: "TINGGI",
  medium: "SEDANG",
  low: "RENDAH",
};

const MOCK_API = process.env.EXPO_PUBLIC_MOCK_AUTH === "true";

let mockStore: Task[] = [
  {
    id: "mock-task-seed-1",
    user_id: "1",
    id_tag: 1,
    task_name: "Belajar React Native",
    date: "2026-05-14T00:00:00.000000Z",
    time: "10:00:00",
    priority: "high",
    status: "ongoing",
    source: null,
    deskripsi: "Pelajari dasar-dasar Expo dan React Native",
    progress: 0,
    goals: "Pahami navigasi\nBuat komponen sederhana",
    goal_points: null,
    tag: mockTags[0] ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function generateId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function listTasks(token: string | null): Promise<Task[]> {
  if (MOCK_API) return [...mockStore];
  return apiFetch<Task[]>("/tasks", token);
}

export async function createTask(
  input: NewTask,
  token: string | null,
): Promise<Task> {
  if (MOCK_API) {
    const tagObj = input.id_tag
      ? (mockTags.find((t) => t.id_tag === input.id_tag) ?? null)
      : null;
    const task: Task = {
      id: generateId(),
      user_id: "1",
      id_tag: input.id_tag ?? null,
      task_name: input.task_name,
      date: input.date,
      time: input.time ?? null,
      priority: input.priority ?? null,
      status: input.status ?? "ongoing",
      source: null,
      deskripsi: input.deskripsi ?? null,
      progress: 0,
      goals: input.goals ?? null,
      goal_points: null,
      tag: tagObj,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStore = [...mockStore, task];
    return task;
  }
  return apiFetch<Task>("/tasks", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
