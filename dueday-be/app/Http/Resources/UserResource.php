<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentStatus = $this->status;

        // Dynamic expiration protection check
        if ($currentStatus === 'subscribed') {
            // Fetch latest active window context 
            $latestActiveSub = $this->subscriptions()
                ->where('status', 'active')
                ->latest()
                ->first();

            // If the expiration time has passed, dynamically fall back to regular status
            if (!$latestActiveSub || Carbon::parse($latestActiveSub->expired_at)->isPast()) {
                $currentStatus = 'regular'; // or your default status option
                
                // Optional Self-Healing: Silent-persist back into database layer
                $this->resource->update(['status' => 'regular']);
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
            'status' => $currentStatus, // Safely adjusted live runtime evaluation
            'language' => $this->language,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}