<?php

namespace App\Services;

use App\Models\Reminder;
use App\Repositories\ReminderRepository;

class ReminderService
{
    public function __construct(private ReminderRepository $reminderRepository) {}

    public function createReminder(string $userId, array $data): Reminder
    {
        $data['user_id'] = $userId;

        return $this->reminderRepository->create($data);
    }

    public function getUserReminders(string $userId)
    {
        return $this->reminderRepository->getByUserId($userId);
    }

    public function getReminderForUser(string $userId, string $reminderId): ?Reminder
    {
        $reminder = $this->reminderRepository->findById($reminderId);

        if ($reminder && $reminder->user_id === $userId) {
            return $reminder;
        }

        return null;
    }

    public function updateReminder(string $userId, string $reminderId, array $data): ?Reminder
    {
        $reminder = $this->reminderRepository->findById($reminderId);

        if (! $reminder || $reminder->user_id !== $userId) {
            return null;
        }

        return $this->reminderRepository->update($reminderId, $data);
    }

    public function deleteReminder(string $userId, string $reminderId): bool
    {
        $reminder = $this->reminderRepository->findById($reminderId);

        if (! $reminder || $reminder->user_id !== $userId) {
            return false;
        }

        return $this->reminderRepository->delete($reminderId);
    }
}
