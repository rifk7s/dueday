<?php

namespace App\Http\Resources;

use App\Services\SubscriptionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $latestActiveSub = $this->subscriptions()
            ->where('status', 'active')
            ->latest()
            ->first();

        // If the latest active row is past its expiry, expire it the same way the scheduled
        // command does (status => 'expired' + is_subscribed cleared) so the lazy path and
        // subscriptions:expire-expired can't disagree and leave a stale 'active' row behind.
        // A lingering 'active' row would make activateOrExtendUserSubscription() extend from a
        // past expired_at instead of from now().
        if ($latestActiveSub && Carbon::parse($latestActiveSub->expired_at)->isPast()) {
            app(SubscriptionService::class)->expireDueSubscriptions();
            $this->resource->refresh();
            $latestActiveSub = null;
        }

        $isSubscribed = (bool) $latestActiveSub;

        if ((bool) $this->is_subscribed !== $isSubscribed) {
            $this->resource->update(['is_subscribed' => $isSubscribed]);
        }

        return [
            'id' => $this->id,
            'photo_url' => $this->photo_url,
            'username' => $this->username,
            'nickname' => $this->nickname,
            'name' => $this->name,
            'email' => $this->email,
            'nim' => $this->nim,
            'is_subscribed' => $isSubscribed,
            'status' => $isSubscribed ? 'subscribed' : 'unsubscribed',
            'subscription_end' => $latestActiveSub?->expired_at,
            'language' => $this->language,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
