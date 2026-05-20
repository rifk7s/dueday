<?php

namespace App\Repositories;

use App\Models\Subscription;
use Illuminate\Support\Str;

class SubscriptionRepository
{
    public function create(array $data): Subscription
    {
        $data['id'] = $data['id'] ?? (string) Str::uuid();

        return Subscription::create($data);
    }

    public function findById(string $id): ?Subscription
    {
        return Subscription::find($id);
    }

    public function getByUserId(string $userId)
    {
        return Subscription::where('user_id', $userId)->latest()->get();
    }

    public function update(string $id, array $data): ?Subscription
    {
        $subscription = $this->findById($id);

        if (! $subscription) {
            return null;
        }

        $subscription->fill($data);
        $subscription->save();

        return $subscription;
    }

    public function delete(string $id): bool
    {
        $subscription = $this->findById($id);

        if (! $subscription) {
            return false;
        }

        return (bool) $subscription->delete();
    }
}