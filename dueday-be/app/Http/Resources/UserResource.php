<?php

namespace App\Http\Resources;

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

        $isSubscribed = $latestActiveSub
            && ! Carbon::parse($latestActiveSub->expired_at)->isPast();

        if ((bool) $this->is_subscribed !== $isSubscribed) {
            $this->resource->update(['is_subscribed' => $isSubscribed]);

            if (! $isSubscribed) {
                $latestActiveSub = null;
            }
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
