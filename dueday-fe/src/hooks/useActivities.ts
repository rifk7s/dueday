import { useSession } from "@/auth/ctx";
import {
  listActivities,
  createActivity,
  getActivity,
  updateActivity,
  type NewActivity,
  type UpdateActivity,
} from "@/api/activities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useActivitiesQuery(options?: { enabled?: boolean }) {
  const { token } = useSession();
  return useQuery({
    queryKey: ["activities"],
    queryFn: () => listActivities(token),
    staleTime: 0,
    refetchInterval: (query) => (query.state.data?.some((a) => a.status === "ongoing") ? 5_000 : false),
    refetchOnMount: true,
    enabled: (options?.enabled ?? true) && !!token,
  });
}

export function useActivityQuery(id: string | undefined, options?: { enabled?: boolean }) {
  const { token } = useSession();
  return useQuery({
    queryKey: ["activity", id],
    queryFn: () => {
      if (!id) throw new Error("Activity ID is required");
      return getActivity(id, token);
    },
    staleTime: 0,
    refetchInterval: (query) => (query.state.data?.status === "ongoing" ? 5_000 : false),
    refetchOnMount: true,
    enabled: (options?.enabled ?? true) && !!token && !!id,
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

export function useUpdateActivityMutation() {
  const { token } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; data: UpdateActivity }) =>
      updateActivity(input.id, input.data, token),
    onSuccess: (activity) => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      qc.invalidateQueries({ queryKey: ["activity", activity.id] });
    },
  });
}
