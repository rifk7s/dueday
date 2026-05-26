import { apiFetch } from "./client";
import type { Tag } from "./tags";
import { mapBackendTagToLegacy, mockTags } from "./tags";

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

type BackendTask = {
  id: string;
  user_id: string;
  tag_id: number | null;
  name: string;
  due_date: string;
  due_time: string | null;
  priority: string | null;
  status: "ongoing" | "completed" | "completed_late";
  source: string | null;
  description: string | null;
  reminder_message: string | null;
  reminder_style?: string | null;
  reminder_sound?: string | null;
  reminder_frequency?: "once" | "daily" | "weekly" | null;
  reminder_vibrate?: boolean | null;
  progress: number;
  goals: string | null;
  goal_points: GoalPoint[] | null;
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

type BackendTaskPayload = {
  name?: string;
  due_date?: string;
  due_time?: string;
  priority?: string;
  tag_id?: number;
  goals?: string;
  description?: string;
  reminder_message?: string | null;
  reminder_style?: string | null;
  reminder_sound?: string | null;
  reminder_frequency?: "once" | "daily" | "weekly" | null;
  reminder_vibrate?: boolean | null;
  status?: "ongoing" | "completed" | "completed_late";
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

function mapBackendTaskToLegacy(task: BackendTask): Task {
  return {
    id: task.id,
    user_id: task.user_id,
    id_tag: task.tag_id,
    task_name: task.name,
    date: task.due_date,
    time: task.due_time,
    priority: task.priority,
    status: task.status,
    source: task.source,
    deskripsi: task.description,
    reminder_message: task.reminder_message,
    reminder_style: task.reminder_style,
    reminder_sound: task.reminder_sound,
    reminder_frequency: task.reminder_frequency,
    reminder_vibrate: task.reminder_vibrate,
    progress: task.progress,
    goals: task.goals,
    goal_points: task.goal_points,
    tag: task.tag ? mapBackendTagToLegacy(task.tag) : null,
    created_at: task.created_at,
    updated_at: task.updated_at,
    is_overdue: task.is_overdue,
  };
}

function mapLegacyTaskInputToBackendPayload(input: Partial<NewTask>): BackendTaskPayload {
  const payload: BackendTaskPayload = {};

  if (input.task_name !== undefined) payload.name = input.task_name;
  if (input.date !== undefined) payload.due_date = input.date;
  if (input.time !== undefined) payload.due_time = input.time;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.id_tag !== undefined) payload.tag_id = input.id_tag;
  if (input.goals !== undefined) payload.goals = input.goals;
  if (input.deskripsi !== undefined) payload.description = input.deskripsi;
  if (input.reminder_message !== undefined) payload.reminder_message = input.reminder_message;
  if (input.reminder_style !== undefined) payload.reminder_style = input.reminder_style;
  if (input.reminder_sound !== undefined) payload.reminder_sound = input.reminder_sound;
  if (input.reminder_frequency !== undefined) payload.reminder_frequency = input.reminder_frequency;
  if (input.reminder_vibrate !== undefined) payload.reminder_vibrate = input.reminder_vibrate;
  if (input.status !== undefined) payload.status = input.status;

  return payload;
}

export async function listTasks(token: string | null): Promise<Task[]> {
  if (MOCK_API) return [...mockStore];
  const tasks = await apiFetch<BackendTask[]>("/tasks", token);
  return tasks.map(mapBackendTaskToLegacy);
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
  const payload = mapLegacyTaskInputToBackendPayload(input);
  const task = await apiFetch<BackendTask>("/tasks", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapBackendTaskToLegacy(task);
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

  const payload = {
    ...mapLegacyTaskInputToBackendPayload(input),
    ...(input.goal_points !== undefined ? { goal_points: input.goal_points } : {}),
  };

  const task = await apiFetch<BackendTask>(`/tasks/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapBackendTaskToLegacy(task);
}

export async function deleteTask(
  id: string,
  token: string | null,
): Promise<void> {
  if (MOCK_API) {
    const existing = mockStore.find((task) => task.id === id);
    if (!existing) {
      throw new Error(`Task with id ${id} not found`);
    }
    mockStore = mockStore.filter((task) => task.id !== id);
    return;
  }

  return apiFetch<void>(`/tasks/${id}`, token, {
    method: "DELETE",
  });
}