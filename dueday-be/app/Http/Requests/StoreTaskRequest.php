<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'due_date' => 'required|date',
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
