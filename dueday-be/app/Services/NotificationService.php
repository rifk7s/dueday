<?php

namespace App\Services;

use App\Models\Notification;
use App\Repositories\NotificationRepository;

class NotificationService
{
    public function __construct(private NotificationRepository $notificationRepository) {}

    public function createNotification(string $userId, array $data): Notification
    {
        $data['user_id'] = $userId;
        $data['is_read'] = $data['is_read'] ?? false;

        return $this->notificationRepository->create($data);
    }

    public function getUserNotifications(string $userId)
    {
        return $this->notificationRepository->getByUserId($userId);
    }

    public function getNotificationForUser(string $userId, string $notificationId): ?Notification
    {
        $notification = $this->notificationRepository->findById($notificationId);

        if ($notification && $notification->user_id === $userId) {
            return $notification;
        }

        return null;
    }

    public function updateNotification(string $userId, string $notificationId, array $data): ?Notification
    {
        $notification = $this->notificationRepository->findById($notificationId);

        if (! $notification || $notification->user_id !== $userId) {
            return null;
        }

        return $this->notificationRepository->update($notificationId, $data);
    }

    public function deleteNotification(string $userId, string $notificationId): bool
    {
        $notification = $this->notificationRepository->findById($notificationId);

        if (! $notification || $notification->user_id !== $userId) {
            return false;
        }

        return $this->notificationRepository->delete($notificationId);
    }
}
