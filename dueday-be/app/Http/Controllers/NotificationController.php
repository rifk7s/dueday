<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNotificationRequest;
use App\Http\Requests\UpdateNotificationRequest;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Services\NotificationService;

class NotificationController extends Controller
{
    public function __construct(private NotificationService $notificationService) {}

    public function index()
    {
        $notifications = $this->notificationService->getUserNotifications(auth()->id());

        return NotificationResource::collection($notifications);
    }

    public function show(Notification $notification)
    {
        $notification = $this->notificationService->getNotificationForUser(auth()->id(), $notification->{$notification->getKeyName()});

        if (! $notification) {
            return response(['message' => 'Notification not found'], 404);
        }

        return new NotificationResource($notification);
    }

    public function store(StoreNotificationRequest $request)
    {
        $notification = $this->notificationService->createNotification(auth()->id(), $request->validated());

        return (new NotificationResource($notification))->response()->setStatusCode(201);
    }

    public function update(UpdateNotificationRequest $request, Notification $notification)
    {
        $notification = $this->notificationService->updateNotification(auth()->id(), $notification->{$notification->getKeyName()}, $request->validated());

        if (! $notification) {
            return response(['message' => 'Notification not found or not owned by user'], 404);
        }

        return new NotificationResource($notification);
    }

    public function destroy(Notification $notification)
    {
        $deleted = $this->notificationService->deleteNotification(auth()->id(), $notification->{$notification->getKeyName()});

        if (! $deleted) {
            return response(['message' => 'Notification not found or not owned by user'], 404);
        }

        return response(null, 204);
    }
}
