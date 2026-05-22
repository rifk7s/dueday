<?php

namespace App\Repositories;

use App\Models\Activity;
use Illuminate\Support\Str;

class ActivityRepository
{
    public function create(array $data): Activity
    {
        $data['id'] = $data['id'] ?? (string) Str::uuid();

        // Use forceCreate to entirely bypass mass-assignment / Fillable caching bugs
        $activity = Activity::forceCreate($data);

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

        // 1. Map general fillable values first
        $activity->fill($data);

        // 2. Explicitly force overwrite the anchor date directly on the attribute last
        if (array_key_exists('anchor_date', $data)) {
            $activity->anchor_date = $data['anchor_date'];
        }

        $activity->save();

        return $activity->load('tag');
    }

    public function delete(string $id): bool
    {
        $activity = Activity::find($id);
        
        if ($activity) {
            return (bool) $activity->delete();
        }
        
        return false;
    }
}