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
            'tag_id' => $this->tag_id,
            'name' => $this->name,
            'date' => $this->date,
            'anchor_date' => $this->anchor_date,
            'time_start' => $this->time_start,
            'time_end' => $this->time_end,
            'status' => $this->status,
            'progress' => $this->progress,
            'progress_started_at' => $this->progress_started_at,
            'description' => $this->description,
            'recurrence' => match($this->recurrence) {
                'setiap_hari' => 'daily',
                'satu_minggu' => 'weekly',
                'satu_bulan' => 'monthly',
                'satu_tahun' => 'yearly',
                default => $this->recurrence,
            },
            'tag' => TagResource::make($this->whenLoaded('tag')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}