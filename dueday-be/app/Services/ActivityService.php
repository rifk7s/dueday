<?php

namespace App\Services;

use App\Models\Activity;
use App\Repositories\ActivityRepository;
use Carbon\Carbon;

class ActivityService
{
    public function __construct(private ActivityRepository $activityRepository) {}

    public function createActivity(string $userId, array $data): Activity
    {
        $data['user_id'] = $userId;
        $data['status'] = $data['status'] ?? 'not_started';
        // For creation treat status as explicitly provided so transitions apply
        $data = $this->applyStatusTransition($data['status'], $data, null, true);

        return $this->activityRepository->create($data);
    }

    public function getUserActivities(string $userId)
    {
        return $this->activityRepository->getByUserId($userId);
    }

    public function getActivityForUser(string $userId, string $activityId): ?Activity
    {
        $activity = $this->activityRepository->findById($activityId);

        if ($activity && $activity->user_id === $userId) {
            return $activity;
        }

        return null;
    }

    public function updateActivity(string $userId, string $activityId, array $data): ?Activity
    {
        $activity = $this->activityRepository->findById($activityId);

        if (! $activity || $activity->user_id !== $userId) {
            return null;
        }

        $nextStatus = $data['status'] ?? $activity->status;
        $statusProvided = array_key_exists('status', $data);
        $data = $this->applyStatusTransition($nextStatus, $data, $activity, $statusProvided);

        return $this->activityRepository->update($activityId, $data);
    }

    public function syncOngoingProgress(): int
    {
        $updated = 0;

        foreach ($this->activityRepository->getOngoingActivities() as $activity) {
            if (! $activity->progress_started_at) {
                $activity->progress_started_at = $this->inferProgressStartedAt($activity);
            }

            $nextProgress = $this->calculateProgress($activity);

            $updates = [];

            if ($activity->progress_started_at && $activity->isDirty('progress_started_at')) {
                $updates['progress_started_at'] = $activity->progress_started_at;
            }

            if ($activity->progress !== $nextProgress) {
                $updates['progress'] = $nextProgress;
            }

            if ($updates !== []) {
                $this->activityRepository->update($activity->id, $updates);
                $updated++;
            }
        }

        return $updated;
    }

    public function syncActivityProgress(Activity $activity): Activity
    {
        if ($activity->status !== 'ongoing') {
            return $activity;
        }

        if (! $activity->progress_started_at) {
            $activity->progress_started_at = $this->inferProgressStartedAt($activity);
        }

        $activity->progress = $this->calculateProgress($activity);
        $activity->save();

        return $activity->load('tag');
    }

    public function calculateProgress(Activity $activity, ?Carbon $now = null): int
    {
        return $this->calculateProgressFromStartAt(
            $activity->tanggal?->format('Y-m-d'),
            $activity->time_start,
            $activity->time_end,
            $activity->progress_started_at?->copy(),
            $now,
        );
    }

    private function applyStatusTransition(string $status, array $data, ?Activity $existingActivity, bool $statusProvided = false): array
    {
        // Only perform status-driven transitions when a status was explicitly provided
        if ($statusProvided) {
            if ($status === 'completed') {
                $data['progress'] = 100;
                $data['progress_started_at'] = null;

                return $data;
            }

            if ($status === 'cancelled') {
                $data['progress'] = (int) ($existingActivity?->progress ?? 0);
                $data['progress_started_at'] = null;

                return $data;
            }

            if ($status === 'not_started') {
                $data['progress'] = 0;
                $data['progress_started_at'] = null;

                return $data;
            }

            if ($status === 'pending' && $existingActivity) {
                $data['progress'] = $this->calculateProgress($existingActivity);
                $data['progress_started_at'] = null;

                return $data;
            }

            if ($status === 'ongoing') {
                $existingProgress = (int) ($existingActivity?->progress ?? 0);

                if ($existingActivity && $existingActivity->status === 'pending' && $existingProgress > 0) {
                    $totalSeconds = $this->getTotalDurationSeconds(
                        $data['tanggal'] ?? $existingActivity->tanggal?->format('Y-m-d'),
                        $data['time_start'] ?? $existingActivity->time_start,
                        $data['time_end'] ?? $existingActivity->time_end,
                    );

                    if ($totalSeconds > 0) {
                        $elapsedSeconds = (int) round(($existingProgress / 100) * $totalSeconds);
                        $data['progress_started_at'] = Carbon::now()->subSeconds($elapsedSeconds);
                        $data['progress'] = $existingProgress;

                        return $data;
                    }
                }

                $data['progress_started_at'] = Carbon::now();
                $data['progress'] = 0;

                return $data;
            }
        }

        // If status was not provided, preserve existing progress fields
        if ($existingActivity) {
            $data['progress'] = (int) ($existingActivity->progress ?? 0);
            $data['progress_started_at'] = $existingActivity->progress_started_at;
        }

        return $data;
    }

    private function calculateProgressFromStartAt(
        ?string $date,
        ?string $timeStart,
        ?string $timeEnd,
        ?Carbon $startedAt,
        ?Carbon $now = null,
    ): int {
        if (! $date || ! $timeStart || ! $timeEnd) {
            return 0;
        }

        $now ??= Carbon::now();

        try {
            $start = Carbon::parse($date.' '.$timeStart);
            $end = Carbon::parse($date.' '.$timeEnd);
        } catch (\Throwable) {
            return 0;
        }

        $startedAt ??= $start;

        $totalSeconds = $start->diffInSeconds($end);
        if ($totalSeconds <= 0) {
            return $now->greaterThanOrEqualTo($end) ? 99 : 0;
        }

        if ($now->lessThanOrEqualTo($startedAt)) {
            return 0;
        }

        $elapsedSeconds = min($startedAt->diffInSeconds($now), $totalSeconds);
        $percent = (int) round(($elapsedSeconds / $totalSeconds) * 100);

        return min(99, max(0, $percent));
    }

    private function inferProgressStartedAt(Activity $activity): Carbon
    {
        $totalSeconds = $this->getTotalDurationSeconds(
            $activity->tanggal?->format('Y-m-d'),
            $activity->time_start,
            $activity->time_end,
        );

        if ($totalSeconds <= 0) {
            return Carbon::now();
        }

        $storedProgress = max(0, min(99, (int) ($activity->progress ?? 0)));

        if ($storedProgress <= 0) {
            return Carbon::now();
        }

        $elapsedSeconds = (int) round(($storedProgress / 100) * $totalSeconds);

        return Carbon::now()->subSeconds($elapsedSeconds);
    }

    private function getTotalDurationSeconds(?string $date, ?string $timeStart, ?string $timeEnd): int
    {
        if (! $date || ! $timeStart || ! $timeEnd) {
            return 0;
        }

        try {
            $start = Carbon::parse($date.' '.$timeStart);
            $end = Carbon::parse($date.' '.$timeEnd);
        } catch (\Throwable) {
            return 0;
        }

        return $start->diffInSeconds($end);
    }

    public function deleteActivity(string $userId, string $activityId): bool
    {
        $activity = $this->activityRepository->findById($activityId);

        if (! $activity || $activity->user_id !== $userId) {
            return false;
        }

        return $this->activityRepository->delete($activityId);
    }
}
