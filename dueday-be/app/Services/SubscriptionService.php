<?php

namespace App\Services;

use App\Models\Subscription;
use App\Repositories\SubscriptionRepository;

class SubscriptionService
{
    public function __construct(private SubscriptionRepository $subscriptionRepository) {}

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
