<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class TaskResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isOverdue = false;

        if ($this->date) {
            $dueDate = Carbon::parse($this->date->toDateString() . ' ' . ($this->time ?? '00:00:00'));
            $isOverdue = $dueDate->lt(now()) && ! in_array($this->status, ['completed', 'completed_late'], true);
        }

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
            'is_overdue' => $isOverdue,
        ];
    }
}
