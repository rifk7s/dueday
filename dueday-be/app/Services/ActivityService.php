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
        
        // Set anchor_date to the same value as tanggal if a repeat rule exists
        if (!empty($data['ulangi']) && isset($data['tanggal'])) {
            $data['anchor_date'] = $data['tanggal'];
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
        $currentRepeatType = array_key_exists('ulangi', $data) ? $data['ulangi'] : $activity->ulangi;

        // 2. BROAD SPECTRUM LOOKUP: Accept any naming style or type from the frontend
        $ubahAnchorRaw = $data['ubah_anchor'] ?? $data['ubahAnchor'] ?? $data['change_anchor'] ?? false;
        
        // Force string 'true', int 1, or boolean true into a strict true boolean primitive
        $ubahAnchorExplicitly = filter_var($ubahAnchorRaw, FILTER_VALIDATE_BOOLEAN);

        if ($currentRepeatType === 'setiap_hari') {
            // Rule A: Daily tasks always automatically align anchor with the current date
            if (array_key_exists('tanggal', $data)) {
                $data['anchor_date'] = $data['tanggal'];
            }
        } elseif (!empty($currentRepeatType) && $ubahAnchorExplicitly === true) {
            // Rule B: Weekly/Monthly/Yearly tasks align anchor ONLY if the frontend prompt was accepted
            // Use the newly changed date if provided; otherwise, fall back to the activity's current date
            $data['anchor_date'] = $data['tanggal'] ?? ($activity->tanggal?->format('Y-m-d'));
        }

        // 3. Clean out all variance flags before updating the repository layer
        unset($data['ubah_anchor'], $data['ubahAnchor'], $data['change_anchor']);

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

        $this->handleRecurringActivityResets();

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

    /**
     * Scan and push completed recurring tasks into their upcoming scheduled calendars.
     */
    private function handleRecurringActivityResets(): void
    {
        $completedRecurring = Activity::where('status', 'completed')
            ->whereNotNull('ulangi')
            ->get();

        foreach ($completedRecurring as $activity) {
            // Using getRawOriginal ensures we get the clean 'YYYY-MM-DD' string directly from the DB
            $baseDateString = $activity->getRawOriginal('anchor_date') ?? $activity->getRawOriginal('tanggal');
            
            if (! $baseDateString) {
                continue;
            }

            $baseDate = Carbon::parse($baseDateString);
            $now = Carbon::now();
            $shouldReset = false;
            $nextAnchorDate = $baseDate->copy();

            switch ($activity->ulangi) {
                case 'setiap_hari':
                    $shouldReset = $now->startOfDay()->greaterThan($baseDate->startOfDay());
                    $nextAnchorDate->addDay();
                    break;
                case 'satu_minggu':
                    $shouldReset = $now->startOfDay()->greaterThanOrEqualTo($baseDate->copy()->addWeek()->startOfDay());
                    $nextAnchorDate->addWeek();
                    break;
                case 'satu_bulan':
                    $shouldReset = $now->startOfDay()->greaterThanOrEqualTo($baseDate->copy()->addMonth()->startOfDay());
                    $nextAnchorDate->addMonth();
                    break;
                case 'satu_tahun':
                    $shouldReset = $now->startOfDay()->greaterThanOrEqualTo($baseDate->copy()->addYear()->startOfDay());
                    $nextAnchorDate->addYear();
                    break;
            }

            if ($shouldReset) {
                $targetDateString = $nextAnchorDate->format('Y-m-d');

                // Completely isolating the array from Laravel's auto-serialization anomalies
                $newCycleData = [
                    'user_id'             => $activity->user_id,
                    'id_tag'              => $activity->id_tag,
                    'activity_name'       => $activity->activity_name,
                    'deskripsi'           => $activity->deskripsi,
                    'ulangi'              => $activity->ulangi,
                    'time_start'          => $activity->time_start,
                    'time_end'            => $activity->time_end,
                    'tanggal'             => $targetDateString,
                    'anchor_date'         => $targetDateString, // Explicit plain string injection
                    'status'              => 'not_started',
                    'progress'            => 0,
                    'progress_started_at' => null,
                ];

                // 1. Create the new clean card entry 
                $this->activityRepository->create($newCycleData);

                // 2. Clear out the repetition flag on the old card so it acts as static history
                $this->activityRepository->update($activity->id, ['ulangi' => null]);
            }
        }
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