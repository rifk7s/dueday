import { useSession } from "@/auth/ctx";
import {
  listActivities,
  createActivity,
  getActivity,
  updateActivity,
  type Activity,
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

export function useActivityQuery(
  id: string | undefined,
  options?: { enabled?: boolean; refetchInterval?: false | number },
) {
  const { token } = useSession();
  return useQuery({
    queryKey: ["activity", id],
    queryFn: () => {
      if (!id) throw new Error("Activity ID is required");
      return getActivity(id, token);
    },
    staleTime: 0,
    refetchInterval:
      options?.refetchInterval ?? ((query) => (query.state.data?.status === "ongoing" ? 5_000 : false)),
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
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["activities"] });
      await qc.cancelQueries({ queryKey: ["activity", id] });

      const previousActivities = qc.getQueryData<Activity[]>(["activities"]);
      const previousActivity = qc.getQueryData<Activity>(["activity", id]);

      const patchActivity = (activity: Activity): Activity => ({
        ...activity,
        ...data,
        status: data.status ?? activity.status,
        progress:
          data.status === "not_started"
            ? 0
            : data.status === "completed"
              ? 100
              : activity.progress,
      });

      if (previousActivities) {
        qc.setQueryData<Activity[]>(["activities"], previousActivities.map((activity) => (activity.id === id ? patchActivity(activity) : activity)));
      }

      if (previousActivity) {
        qc.setQueryData<Activity>(["activity", id], patchActivity(previousActivity));
      }

      return { previousActivities, previousActivity, id };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;

      if (context.previousActivities) {
        qc.setQueryData(["activities"], context.previousActivities);
      }

      if (context.previousActivity) {
        qc.setQueryData(["activity", context.id], context.previousActivity);
      }
    },
    onSuccess: (activity) => {
      qc.setQueryData(["activity", activity.id], activity);
      qc.setQueryData(["activities"], (current: unknown) => {
        if (!Array.isArray(current)) {
          return current;
        }

        return current.map((item) => (item && typeof item === "object" && "id" in item && item.id === activity.id ? activity : item));
      });
      qc.invalidateQueries({ queryKey: ["activities"] });
      qc.invalidateQueries({ queryKey: ["activity", activity.id] });
    },
  });
}
