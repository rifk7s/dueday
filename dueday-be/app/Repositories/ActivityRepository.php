<?php

namespace App\Repositories;

use App\Models\Activity;
use Illuminate\Support\Str;

class ActivityRepository
{
    public function create(array $data): Activity
    {
        $data['id'] = $data['id'] ?? (string) Str::uuid();

        $activity = Activity::create($data);

        return $activity->load('tag');
    }

    public function findById(string $id): ?Activity
    {
        return Activity::with('tag')->find($id);
    }

    public function getByUserId(string $userId)
    {
        return Activity::with('tag')->where('user_id', $userId)->get();
    }

    public function getOngoingActivities()
    {
        return Activity::with('tag')->where('status', 'ongoing')->get();
    }

    public function update(string $id, array $data): ?Activity
    {
        $activity = $this->findById($id);

        if (! $activity) {
            return null;
        }

        $activity->fill($data);
        $activity->save();

        return $activity->load('tag');
    }

    public function delete(string $id): bool
    {
        $activity = $this->findById($id);

        if (! $activity) {
            return false;
        }

        return (bool) $activity->delete();
    }
}
