<?php

namespace App\Repositories;

use App\Models\Activity;
use Illuminate\Support\Str;

class ActivityRepository
{
    public function create(array $data): Activity
    {
        $data['id'] = $data['id'] ?? (string) Str::uuid();

        return Activity::create($data);
    }

    public function findById(string $id): ?Activity
    {
        return Activity::find($id);
    }

    public function getByUserId(string $userId)
    {
        return Activity::where('user_id', $userId)->get();
    }

    public function update(string $id, array $data): ?Activity
    {
        $activity = $this->findById($id);

        if (! $activity) {
            return null;
        }

        $activity->fill($data);
        $activity->save();

        return $activity;
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
