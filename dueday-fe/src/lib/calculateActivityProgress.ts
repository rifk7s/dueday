import type { Activity } from "@/api/activities";

export function calculateActivityProgress(activity: Activity, nowOverride?: Date): number {
  const rawDate = activity.tanggal ?? null;
  const timeStart = activity.time_start ?? null;
  const timeEnd = activity.time_end ?? null;

  if (!rawDate || !timeStart || !timeEnd) return 0;

  // Normalize date to YYYY-MM-DD in case API included time portion
  const date = String(rawDate).split("T")[0];

  const now = nowOverride ?? new Date();

  const start = new Date(`${date}T${timeStart}`);
  const end = new Date(`${date}T${timeEnd}`);

  // If the activity has a client-side or server-side progress_started_at, use it as the
  // effective startedAt so progress can resume from a non-zero value.
  let startedAt: Date | null = null;
  if (activity.progress_started_at) {
    const parsed = new Date(activity.progress_started_at);
    if (isFinite(parsed.getTime())) {
      startedAt = parsed;
    }
  }
  if (!startedAt) {
    startedAt = start;
  }

  // Guard against invalid dates
  if (!isFinite(start.getTime()) || !isFinite(end.getTime())) return 0;

  const totalSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
  if (totalSeconds <= 0) {
    return now.getTime() >= end.getTime() ? 99 : 0;
  }

  // If now is before or equal to the effective startedAt, progress is 0
  if (now.getTime() <= startedAt.getTime()) return 0;

  const elapsedSeconds = Math.min(Math.floor((now.getTime() - startedAt.getTime()) / 1000), totalSeconds);
  const percent = Math.round((elapsedSeconds / totalSeconds) * 100);
  const final = Math.min(99, Math.max(0, percent));

  // Debugging aid: if a developer notices 0 but date/time exist, log for inspection.
  if (final === 0 && date && timeStart && timeEnd) {
    // eslint-disable-next-line no-console
    console.debug("calculateActivityProgress debug", {
      id: activity.id,
      date,
      timeStart,
      timeEnd,
      now: now.toISOString(),
      start: start.toISOString(),
      end: end.toISOString(),
      totalSeconds,
      elapsedSeconds,
      percent,
      final,
    });
  }

  return final;
}

export default calculateActivityProgress;
