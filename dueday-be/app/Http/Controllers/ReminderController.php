<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReminderRequest;
use App\Http\Requests\UpdateReminderRequest;
use App\Http\Resources\ReminderResource;
use App\Models\Reminder;
use App\Services\ReminderService;

class ReminderController extends Controller
{
    public function __construct(private ReminderService $reminderService) {}

    public function index()
    {
        $reminders = $this->reminderService->getUserReminders(auth()->id());

        return ReminderResource::collection($reminders);
    }

    public function show(Reminder $reminder)
    {
        $reminder = $this->reminderService->getReminderForUser(auth()->id(), $reminder->{$reminder->getKeyName()});

        if (! $reminder) {
            return response(['message' => 'Reminder not found'], 404);
        }

        return new ReminderResource($reminder);
    }

    public function store(StoreReminderRequest $request)
    {
        $reminder = $this->reminderService->createReminder(auth()->id(), $request->validated());

        return (new ReminderResource($reminder))->response()->setStatusCode(201);
    }

    public function update(UpdateReminderRequest $request, Reminder $reminder)
    {
        $reminder = $this->reminderService->updateReminder(auth()->id(), $reminder->{$reminder->getKeyName()}, $request->validated());

        if (! $reminder) {
            return response(['message' => 'Reminder not found or not owned by user'], 404);
        }

        return new ReminderResource($reminder);
    }

    public function destroy(Reminder $reminder)
    {
        $deleted = $this->reminderService->deleteReminder(auth()->id(), $reminder->{$reminder->getKeyName()});

        if (! $deleted) {
            return response(['message' => 'Reminder not found or not owned by user'], 404);
        }

        return response(null, 204);
    }
}
