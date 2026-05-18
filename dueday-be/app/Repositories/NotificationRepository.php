<?php

namespace App\Repositories;

use App\Models\Notification;
use Illuminate\Support\Str;

class NotificationRepository
{
    public function create(array $data): Notification
    {
        $data['id'] = $data['id'] ?? (string) Str::uuid();

        return Notification::create($data);
    }

    public function findById(string $id): ?Notification
    {
        return Notification::find($id);
    }

    public function getByUserId(string $userId)
    {
        return Notification::where('user_id', $userId)->latest()->get();
    }

    public function update(string $id, array $data): ?Notification
    {
        $notification = $this->findById($id);

        if (! $notification) {
            return null;
        }

        $notification->fill($data);
        $notification->save();

        return $notification;
    }

    public function delete(string $id): bool
    {
        $notification = $this->findById($id);

        if (! $notification) {
            return false;
        }

        return (bool) $notification->delete();
    }
}
