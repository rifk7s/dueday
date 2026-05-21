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
        $isSubscribed = (bool) $this->is_subscribed;

        if ($isSubscribed) {
            $latestActiveSub = $this->subscriptions()
                ->where('status', 'active')
                ->latest()
                ->first();

            if (! $latestActiveSub || Carbon::parse($latestActiveSub->expired_at)->isPast()) {
                $isSubscribed = false;
                $this->resource->update(['is_subscribed' => false]);
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
            'language' => $this->language,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
