<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSubscriptionRequest;
use App\Http\Requests\UpdateSubscriptionRequest;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use App\Services\SubscriptionService;

class SubscriptionController extends Controller
{
    public function __construct(private SubscriptionService $subscriptionService) {}

    public function index()
    {
        $subscriptions = $this->subscriptionService->getUserSubscriptions(auth()->id());

        return SubscriptionResource::collection($subscriptions);
    }

    public function show(Subscription $subscription)
    {
        $subscription = $this->subscriptionService->getSubscriptionForUser(auth()->id(), $subscription->{$subscription->getKeyName()});

        if (! $subscription) {
            return response(['message' => 'Subscription not found'], 404);
        }

        return new SubscriptionResource($subscription);
    }

    public function store(StoreSubscriptionRequest $request)
    {
        $subscription = $this->subscriptionService->createSubscription(auth()->id(), $request->validated());

        return (new SubscriptionResource($subscription))->response()->setStatusCode(201);
    }

    public function update(UpdateSubscriptionRequest $request, Subscription $subscription)
    {
        $subscription = $this->subscriptionService->updateSubscription(auth()->id(), $subscription->{$subscription->getKeyName()}, $request->validated());

        if (! $subscription) {
            return response(['message' => 'Subscription not found or not owned by user'], 404);
        }

        return new SubscriptionResource($subscription);
    }

    public function destroy(Subscription $subscription)
    {
        $deleted = $this->subscriptionService->deleteSubscription(auth()->id(), $subscription->{$subscription->getKeyName()});

        if (! $deleted) {
            return response(['message' => 'Subscription not found or not owned by user'], 404);
        }

        return response(null, 204);
    }
}
