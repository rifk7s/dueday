<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreActivityRequest;
use App\Http\Requests\UpdateActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Services\ActivityService;

class ActivityController extends Controller
{
    public function __construct(private ActivityService $activityService)
    {
        $this->authorizeResource(Activity::class, 'activity');
    }

    public function index()
    {
        $activities = $this->activityService->getUserActivities(auth()->id());

        return ActivityResource::collection($activities);
    }

    public function show(Activity $activity)
    {
        $activity = $this->activityService->getActivityForUser(auth()->id(), $activity->{$activity->getKeyName()});

        if (! $activity) {
            return response(['message' => 'Activity not found'], 404);
        }

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
