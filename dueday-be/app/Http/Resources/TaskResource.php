<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
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
            'task_name' => $this->task_name,
            'date' => $this->date,
            'time' => $this->time,
            'priority' => $this->priority,
            'status' => $this->status,
            'source' => $this->source,
            'deskripsi' => $this->deskripsi,
            'progress' => $this->progress,
            'goals' => $this->goals,
            'goal_points' => $this->goal_points,
            'tag' => TagResource::make($this->whenLoaded('tag')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
