import { useSession } from "@/auth/ctx";
import { listTasks, createTask, type NewTask } from "@/api/tasks";
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
    },
  });
}
