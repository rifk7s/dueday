import { useSession } from "@/auth/ctx";
import { listActivities, createActivity, type NewActivity } from "@/api/activities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useActivitiesQuery(options?: { enabled?: boolean }) {
  const { token } = useSession();
  return useQuery({
    queryKey: ["activities"],
    queryFn: () => listActivities(token),
    staleTime: 5 * 60 * 1000,
    enabled: (options?.enabled ?? true) && !!token,
  });
}

export function useCreateActivityMutation() {
  const { token } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewActivity) => createActivity(input, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
