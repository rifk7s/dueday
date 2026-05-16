<?php

namespace App\Services;

use App\Repositories\ActivityRepository;
use App\Models\Activity;

class ActivityService
{
    public function __construct(private ActivityRepository $activityRepository) {}

    public function createActivity(string $userId, array $data): Activity
    {
        $data['user_id'] = $userId;
        $data['status'] = $data['status'] ?? 'not_started';

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

        return $this->activityRepository->update($activityId, $data);
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
