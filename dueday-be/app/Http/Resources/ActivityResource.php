<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'id_tag' => $this->id_tag,
            'activity_name' => $this->activity_name,
            'tanggal' => $this->tanggal,
            'time_start' => $this->time_start,
            'time_end' => $this->time_end,
            'status' => $this->status,
            'progress' => $this->progress,
            'deskripsi' => $this->deskripsi,
            'ulangi' => $this->ulangi,
            'tag' => TagResource::make($this->whenLoaded('tag')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
