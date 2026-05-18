<?php

namespace App\Repositories;

use App\Models\Reminder;
use Illuminate\Support\Str;

class ReminderRepository
{
    public function create(array $data): Reminder
    {
        $data['id'] = $data['id'] ?? (string) Str::uuid();

        return Reminder::create($data);
    }

    public function findById(string $id): ?Reminder
    {
        return Reminder::find($id);
    }

    public function getByUserId(string $userId)
    {
        return Reminder::where('user_id', $userId)->get();
    }

    public function update(string $id, array $data): ?Reminder
    {
        $reminder = $this->findById($id);

        if (! $reminder) {
            return null;
        }

        $reminder->fill($data);
        $reminder->save();

        return $reminder;
    }

    public function delete(string $id): bool
    {
        $reminder = $this->findById($id);

        if (! $reminder) {
            return false;
        }

        return (bool) $reminder->delete();
    }
}
