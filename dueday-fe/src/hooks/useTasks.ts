import { createTask, deleteTask, listTasks, updateTask, type NewTask, type UpdateTask } from "@/api/tasks";
import { useSession } from "@/auth/ctx";
import { syncReminderNotifications } from "@/hooks/useReminders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useTasksQuery(options?: { enabled?: boolean }) {
  const { token } = useSession();
  return useQuery({
    queryKey: ["tasks"],
    queryFn: () => listTasks(token),
    staleTime: 5 * 60 * 1000,
    enabled: (options?.enabled ?? true) && !!token,
  });
}

export function useCreateTaskMutation() {
  const { token } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTask) => createTask(input, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      void syncReminderNotifications(token).catch(() => null);
    },
  });
}

export function useUpdateTaskMutation() {
  const { token } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; data: UpdateTask }) => updateTask(input.id, input.data, token),
    onSuccess: (updatedTask) => {
      qc.setQueryData(["tasks"], (current: unknown) => {
        if (!Array.isArray(current)) {
          return current;
        }

        return current.map((task) => (task && typeof task === "object" && "id" in task && task.id === updatedTask.id ? updatedTask : task));
      });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      void syncReminderNotifications(token).catch(() => null);
    },
  });
}

export function useDeleteTaskMutation() {
  const { token } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id, token),
    onSuccess: (_, deletedId) => {
      // Optimistic cache eviction: drop the entry from the client state immediately
      qc.setQueryData(["tasks"], (current: unknown) => {
        if (!Array.isArray(current)) return current;
        return current.filter((task) => task && typeof task === "object" && "id" in task && task.id !== deletedId);
      });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      void syncReminderNotifications(token).catch(() => null);
    },
  });
}