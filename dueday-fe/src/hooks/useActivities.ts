import {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  updateActivity,
  type Activity,
  type NewActivity,
  type UpdateActivity,
} from "@/api/activities";
import { calculateActivityProgress } from "@/lib/calculateActivityProgress";
import { useSession } from "@/auth/ctx";
import { scheduleSyncReminderNotifications } from "@/hooks/useReminders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useActivitiesQuery(options?: { enabled?: boolean }) {
  const { token } = useSession();
  return useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const activities = await listActivities(token);
      return activities.map((a) => {
        const serverProgress = typeof a.progress === 'number' && Number.isFinite(a.progress) ? a.progress : null;

        if (a.status === "ongoing") {
          // For ongoing activities compute live progress
          return { ...a, progress: calculateActivityProgress(a) };
        }

        // For non-ongoing activities prefer server-stored progress, fallback to calculation or 0
        return { ...a, progress: serverProgress ?? calculateActivityProgress(a) ?? 0 };
      });
    },
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
      return getActivity(id, token).then((activity) => {
        const serverProgress = typeof activity.progress === 'number' && Number.isFinite(activity.progress) ? activity.progress : null;

        if (activity.status === "ongoing") {
          return { ...activity, progress: calculateActivityProgress(activity) } as Activity;
        }

        return { ...activity, progress: serverProgress ?? calculateActivityProgress(activity) ?? 0 } as Activity;
      });
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
      scheduleSyncReminderNotifications(token);
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
        progress: typeof data.progress === 'number' ? data.progress : (
          data.status === "not_started"
            ? 0
            : data.status === "completed"
              ? 100
              : activity.progress
        ),
        // If transitioning to ongoing, compute a client-side progress_started_at to resume
        progress_started_at: (() => {
          if (data.status === "ongoing") {
            const existingProgress = activity.progress ?? 0;
            // If we're resuming from pending with a non-zero progress, backfill started_at
            if (activity.status === "pending" && existingProgress > 0 && activity.tanggal && activity.time_start && activity.time_end) {
              const date = String(activity.tanggal).split("T")[0];
              const start = new Date(`${date}T${activity.time_start}`);
              const end = new Date(`${date}T${activity.time_end}`);
              const totalSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
              if (totalSeconds > 0) {
                const elapsedSeconds = Math.round((existingProgress / 100) * totalSeconds);
                return new Date(Date.now() - elapsedSeconds * 1000).toISOString();
              }
            }
            // Default: mark started now to begin progress from zero
            return new Date().toISOString();
          }

          return activity.progress_started_at ?? null;
        })(),
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
      // Preserve any client-side progress_started_at we set during optimistic update.
      const previous = qc.getQueryData<Activity>(["activity", activity.id]);
      const merged = { ...activity, progress_started_at: previous?.progress_started_at ?? activity.progress_started_at ?? null };

      qc.setQueryData(["activity", activity.id], merged as Activity);
      qc.setQueryData(["activities"], (current: unknown) => {
        if (!Array.isArray(current)) {
          return current;
        }

        return current.map((item) => (item && typeof item === "object" && "id" in item && item.id === activity.id ? merged : item));
      });
      qc.invalidateQueries({ queryKey: ["activities"] });
      qc.invalidateQueries({ queryKey: ["activity", activity.id] });
      scheduleSyncReminderNotifications(token);
    },
  });
}

export function useDeleteActivityMutation() {
  const { token } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteActivity(id, token),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      qc.invalidateQueries({ queryKey: ["activity", id] });
      scheduleSyncReminderNotifications(token);
    },
  });
}