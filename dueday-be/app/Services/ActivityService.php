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

        if (! empty($data['recurrence'])) {
            $data['recurrence'] = $this->normalizeRecurrenceInput($data['recurrence']);

            if (isset($data['date'])) {
                $data['anchor_date'] = $data['date'];
            }
        }

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

        // 1. Resolve what the active repetition rule is (newly submitted or existing)
        $currentRepeatType = array_key_exists('recurrence', $data)
            ? $this->normalizeRecurrenceInput($data['recurrence'])
            : $this->normalizeRecurrenceInput($activity->recurrence);

        $ubahAnchorExplicitly = filter_var($data['ubah_anchor'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if ($currentRepeatType === 'daily') {
            // Rule A: Daily tasks always automatically align anchor with the current date
            if (array_key_exists('date', $data)) {
                $data['anchor_date'] = $data['date'];
            }
        } elseif (! empty($currentRepeatType) && $ubahAnchorExplicitly === true) {
            // Rule B: Weekly/Monthly/Yearly tasks align anchor ONLY if the frontend prompt was accepted
            $data['anchor_date'] = $data['date'] ?? $activity->date?->format('Y-m-d');
        }

        // 3. Clean out the variance flag before updating the repository layer
        unset($data['ubah_anchor']);

        $nextStatus = $data['status'] ?? $activity->status;
        $statusProvided = array_key_exists('status', $data);
        $data = $this->applyStatusTransition($nextStatus, $data, $activity, $statusProvided);

        return $this->activityRepository->update($activityId, $data);
    }

    public function syncOngoingProgress(): int
    {
        // Disabled server-side progress sync — progress is computed on clients now.
        return 0;
    }

    public function syncActivityProgress(Activity $activity): Activity
    {
        // Do not update progress on the server; clients compute progress instead.
        return $activity->load('tag');
    }

    public function calculateProgress(Activity $activity, ?Carbon $now = null): int
    {
        // Return stored progress only. Progress calculation moved to frontend clients.
        return (int) ($activity->progress ?? 0);
    }

    /**
     * Create the next occurrence for completed recurring activities.
     */
    public function handleRecurringActivityResets(): void
    {
        $completedRecurring = Activity::where('status', 'completed')
            ->whereNotNull('recurrence')
            ->get();

        foreach ($completedRecurring as $activity) {
            // Using getRawOriginal ensures we get the clean 'YYYY-MM-DD' string directly from the DB
            $baseDateString = $activity->getRawOriginal('anchor_date') ?? $activity->getRawOriginal('date');

            if (! $baseDateString) {
                continue;
            }

            $baseDate = Carbon::parse($baseDateString);
            $nextAnchorDate = $baseDate->copy();

            switch ($activity->recurrence) {
                case 'daily':
                    $nextAnchorDate->addDay();
                    break;
                case 'weekly':
                    $nextAnchorDate->addWeek();
                    break;
                case 'monthly':
                    $nextAnchorDate->addMonth();
                    break;
                case 'yearly':
                    $nextAnchorDate->addYear();
                    break;
            }

            $targetDateString = $nextAnchorDate->format('Y-m-d');

            $alreadyExists = Activity::query()
                ->where('user_id', $activity->user_id)
                ->where('name', $activity->name)
                ->where('date', $targetDateString)
                ->where('time_start', $activity->time_start)
                ->where('time_end', $activity->time_end)
                ->where('recurrence', $activity->recurrence)
                ->exists();

            if ($alreadyExists) {
                $this->activityRepository->update($activity->id, ['recurrence' => null]);

                continue;
            }

            $newCycleData = [
                'user_id' => $activity->user_id,
                'tag_id' => $activity->tag_id,
                'name' => $activity->name,
                'description' => $activity->description,
                'recurrence' => $activity->recurrence,
                'time_start' => $activity->time_start,
                'time_end' => $activity->time_end,
                'date' => $targetDateString,
                'anchor_date' => $targetDateString,
                'status' => 'not_started',
                'progress' => 0,
                'progress_started_at' => null,
            ];

            // 1. Create the new clean card entry
            $this->activityRepository->create($newCycleData);

            // 2. Clear out the repetition flag on the old card so it acts as static history
            $this->activityRepository->update($activity->id, ['recurrence' => null]);
        }
    }

    private function normalizeRecurrenceInput(?string $val): ?string
    {
        if ($val === null) {
            return null;
        }

        $map = [
            // map English -> English (DB)
            'daily' => 'daily',
            'weekly' => 'weekly',
            'monthly' => 'monthly',
            'yearly' => 'yearly',
            // accept Indonesian legacy values -> map to English DB values
            'setiap_hari' => 'daily',
            'satu_minggu' => 'weekly',
            'satu_bulan' => 'monthly',
            'satu_tahun' => 'yearly',
        ];

        return $map[$val] ?? null;
    }

    private function applyStatusTransition(string $status, array $data, ?Activity $existingActivity, bool $statusProvided = false): array
    {
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
                // If the client provided an explicit progress value, respect it (e.g., when pausing)
                if (array_key_exists('progress', $data)) {
                    $data['progress'] = (int) $data['progress'];
                    // If client explicitly provided progress_started_at, respect it; otherwise clear it
                    $data['progress_started_at'] = array_key_exists('progress_started_at', $data) ? $data['progress_started_at'] : null;

                    return $data;
                }

                $data['progress'] = $this->calculateProgress($existingActivity);
                $data['progress_started_at'] = null;

                return $data;
            }

            if ($status === 'ongoing') {
                $existingProgress = (int) ($existingActivity?->progress ?? 0);

                if ($existingActivity && $existingActivity->status === 'pending' && $existingProgress > 0) {
                    $totalSeconds = $this->getTotalDurationSeconds(
                        $data['date'] ?? $existingActivity->date?->format('Y-m-d'),
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
            $activity->date?->format('Y-m-d'),
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
