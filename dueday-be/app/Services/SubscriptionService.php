<?php

namespace App\Services;

use App\Models\Subscription;
use App\Repositories\SubscriptionRepository;
use Carbon\Carbon;

class SubscriptionService
{
    public function __construct(private SubscriptionRepository $subscriptionRepository) {}

    /**
     * Business logic rule to activate a new or extend an existing user subscription.
     */
    public function activateOrExtendUserSubscription(string $userId, string $planName, int $months): Subscription
    {
        // 1. Look for existing subscriptions via repository layer
        $subscriptions = $this->subscriptionRepository->getByUserId($userId);
        $latestSubscription = $subscriptions->first(); // Collect latest because repo uses ->latest()

        // 2. Base date calculation logic
        // If they have an active plan already, extend from their existing expiration date.
        // Otherwise, start the access validity window right now.
        $baseDate = ($latestSubscription && $latestSubscription->status === 'active' && $latestSubscription->expired_at)
            ? Carbon::parse($latestSubscription->expired_at)
            : Carbon::now();

        $startedAt = ($latestSubscription && $latestSubscription->status === 'active')
            ? $latestSubscription->started_at
            : Carbon::now();

        $expiredAt = $baseDate->addMonths($months);

        $payload = [
            'plan' => $planName,
            'status' => 'active',
            'started_at' => $startedAt,
            'expired_at' => $expiredAt,
        ];

        // 3. If a record exists, update it cleanly. Otherwise, create a brand new row entry.
        if ($latestSubscription) {
            return $this->subscriptionRepository->update($latestSubscription->id, $payload);
        }

        return $this->createSubscription($userId, $payload);
    }

    public function createSubscription(string $userId, array $data): Subscription
    {
        $data['user_id'] = $userId;
        $data['status'] = $data['status'] ?? 'pending';

        return $this->subscriptionRepository->create($data);
    }

    public function getUserSubscriptions(string $userId)
    {
        return $this->subscriptionRepository->getByUserId($userId);
    }

    public function getSubscriptionForUser(string $userId, string $subscriptionId): ?Subscription
    {
        $subscription = $this->subscriptionRepository->findById($subscriptionId);

        if ($subscription && $subscription->user_id === $userId) {
            return $subscription;
        }

        return null;
    }

    public function updateSubscription(string $userId, string $subscriptionId, array $data): ?Subscription
    {
        $subscription = $this->subscriptionRepository->findById($subscriptionId);

        if (! $subscription || $subscription->user_id !== $userId) {
            return null;
        }

        return $this->subscriptionRepository->update($subscriptionId, $data);
    }

    public function deleteSubscription(string $userId, string $subscriptionId): bool
    {
        $subscription = $this->subscriptionRepository->findById($subscriptionId);

        if (! $subscription || $subscription->user_id !== $userId) {
            return false;
        }

        return $this->subscriptionRepository->delete($subscriptionId);
    }
}