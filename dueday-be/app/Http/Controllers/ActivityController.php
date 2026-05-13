<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreActivityRequest;
use App\Http\Requests\UpdateActivityRequest;
use App\Services\ActivityService;
use App\Models\Activity;
use Illuminate\Http\Response;

class ActivityController extends Controller
{
    public function __construct(private ActivityService $activityService)
    {
        $this->authorizeResource(\App\Models\Activity::class, 'activity');
    }

    public function index(): Response
    {
        $activities = $this->activityService->getUserActivities(auth()->id());

        return response($activities, 200);
    }

    public function show(Activity $activity): Response
    {
        $activity = $this->activityService->getActivityForUser(auth()->id(), $activity->{$activity->getKeyName()});

        if (! $activity) {
            return response(['message' => 'Activity not found'], 404);
        }

        return response($activity, 200);
    }

    public function store(StoreActivityRequest $request): Response
    {
        $activity = $this->activityService->createActivity(auth()->id(), $request->validated());

        return response($activity, 201);
    }

    public function update(UpdateActivityRequest $request, Activity $activity): Response
    {
        $activity = $this->activityService->updateActivity(auth()->id(), $activity->{$activity->getKeyName()}, $request->validated());

        if (! $activity) {
            return response(['message' => 'Activity not found or not owned by user'], 404);
        }

        return response($activity, 200);
    }

    public function destroy(Activity $activity): Response
    {
        $deleted = $this->activityService->deleteActivity(auth()->id(), $activity->{$activity->getKeyName()});

        if (! $deleted) {
            return response(['message' => 'Activity not found or not owned by user'], 404);
        }

        return response(null, 204);
    }
}
