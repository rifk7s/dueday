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
  status: "ongoing" | "completed" | "completed_late";
  source: string | null;
  deskripsi: string | null;
  reminder_message: string | null;
  reminder_style?: string | null;
  reminder_sound?: string | null;
  reminder_frequency?: "once" | "daily" | "weekly" | null;
  reminder_vibrate?: boolean | null;
  progress: number;
  goals: string | null;
  goal_points: GoalPoint[] | null;
  tag: Tag | null;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
};

export type NewTask = {
  task_name: string;
  date: string;
  time?: string;
  priority?: string;
  id_tag?: number;
  goals?: string;
  deskripsi?: string;
  reminder_message?: string | null;
  reminder_style?: string | null;
  reminder_sound?: string | null;
  reminder_frequency?: "once" | "daily" | "weekly" | null;
  reminder_vibrate?: boolean | null;
  status?: "ongoing" | "completed" | "completed_late";
};

export type UpdateTask = Partial<NewTask> & {
  goal_points?: GoalPoint[];
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

function calculateGoalProgress(goalPoints: GoalPoint[] | null | undefined): number {
  if (!goalPoints || goalPoints.length === 0) {
    return 0;
  }

  const completedCount = goalPoints.filter((goalPoint) => goalPoint.completed).length;
  return Math.round((completedCount / goalPoints.length) * 100);
}

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
    reminder_message: null,
    reminder_style: null,
    reminder_sound: null,
    reminder_frequency: null,
    reminder_vibrate: null,
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
      reminder_message: null,
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

export async function updateTask(
  id: string,
  input: UpdateTask,
  token: string | null,
): Promise<Task> {
  if (MOCK_API) {
    const existing = mockStore.find((task) => task.id === id);
    if (!existing) {
      throw new Error(`Task with id ${id} not found`);
    }

    const nextGoalPoints = input.goal_points ?? existing.goal_points;
    const next: Task = {
      ...existing,
      ...input,
      goal_points: nextGoalPoints ?? null,
      progress: nextGoalPoints ? calculateGoalProgress(nextGoalPoints) : existing.progress,
      reminder_message: input.reminder_message ?? existing.reminder_message,
      reminder_style: input.reminder_style ?? existing.reminder_style,
      reminder_sound: input.reminder_sound ?? existing.reminder_sound,
      reminder_frequency: input.reminder_frequency ?? existing.reminder_frequency,
      reminder_vibrate: input.reminder_vibrate ?? existing.reminder_vibrate,
      updated_at: new Date().toISOString(),
    };

    mockStore = mockStore.map((task) => (task.id === id ? next : task));
    return next;
  }

  return apiFetch<Task>(`/tasks/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
