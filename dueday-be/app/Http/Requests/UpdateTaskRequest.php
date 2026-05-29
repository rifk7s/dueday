<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'due_date' => 'sometimes|date',
            'due_time' => 'nullable|date_format:H:i:s',
            'priority' => 'nullable|string',
            'tag_id' => [
                'nullable',
                'integer',
                // Only a global tag or one the caller owns may be attached.
                Rule::exists('tags', 'id')->where(function ($query): void {
                    $query->whereNull('user_id')->orWhere('user_id', $this->user()?->id);
                }),
            ],
            'source' => 'nullable|string',
            'description' => 'nullable|string',
            'goals' => 'nullable|string',
            'goal_points' => 'nullable|array',
            'goal_points.*.id' => 'required|integer',
            'goal_points.*.text' => 'required|string',
            'goal_points.*.completed' => 'required|boolean',
            'progress' => 'nullable|integer|min:0|max:100',
            'status' => 'nullable|in:ongoing,completed,completed_late',
        ];
    }
}
