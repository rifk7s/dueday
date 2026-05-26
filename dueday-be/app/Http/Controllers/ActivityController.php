<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreActivityRequest;
use App\Http\Requests\UpdateActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Services\ActivityService;

class ActivityController extends Controller
{
    public function __construct(private ActivityService $activityService) {}

    public function index()
    {
        // Progress is now calculated on the frontend to avoid heavy server-side work.
        $activities = $this->activityService->getUserActivities(auth()->id());

        return ActivityResource::collection($activities);
    }

    public function show(Activity $activity)
    {
        $activity = $this->activityService->getActivityForUser(auth()->id(), $activity->{$activity->getKeyName()});

        if (! $activity) {
            return response(['message' => 'Activity not found'], 404);
        }

        // Do not sync progress on read; frontend computes progress instead.
        return new ActivityResource($activity);
    }

    public function store(StoreActivityRequest $request)
    {
        $activity = $this->activityService->createActivity(auth()->id(), $request->validated());

        return (new ActivityResource($activity))->response()->setStatusCode(201);
    }

    public function update(UpdateActivityRequest $request, Activity $activity)
    {
        $activity = $this->activityService->updateActivity(auth()->id(), $activity->{$activity->getKeyName()}, $request->validated());

        if (! $activity) {
            return response(['message' => 'Activity not found or not owned by user'], 404);
        }

        if ($activity->status === 'completed' && $activity->recurrence) {
            $this->activityService->handleRecurringActivityResets();
        }

        return new ActivityResource($activity);
    }

    public function destroy(Activity $activity)
    {
        $deleted = $this->activityService->deleteActivity(auth()->id(), $activity->{$activity->getKeyName()});

        if (! $deleted) {
            return response(['message' => 'Activity not found or not owned by user'], 404);
        }

        return response(null, 204);
    }
}
