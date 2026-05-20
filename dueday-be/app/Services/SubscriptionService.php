<?php

namespace App\Services;

use App\Models\Subscription;
use App\Repositories\SubscriptionRepository;
use App\Repositories\UserRepository;
use Carbon\Carbon;

class SubscriptionService
{
    // Inject UserRepository alongside the SubscriptionRepository
    public function __construct(
        private SubscriptionRepository $subscriptionRepository,
        private UserRepository $userRepository
    ) {}

    /**
     * Business logic rule to activate a new or extend an existing user subscription.
     */
    public function activateOrExtendUserSubscription(string $userId, string $planName, int $months): Subscription
    {
        $subscriptions = $this->subscriptionRepository->getByUserId($userId);
        $latestSubscription = $subscriptions->first();

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

        if ($latestSubscription) {
            $subscription = $this->subscriptionRepository->update($latestSubscription->id, $payload);
        } else {
            $subscription = $this->createSubscription($userId, $payload);
        }

        // ⚡ FORCE USER STATUS SYNC HERE
        $user = $this->userRepository->findById($userId);
        if ($user) {
            // Change status to 'subscribed' matching your mobile application needs
            $this->userRepository->update($user, [
                'status' => 'subscribed'
            ]);
        }

        return $subscription;
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