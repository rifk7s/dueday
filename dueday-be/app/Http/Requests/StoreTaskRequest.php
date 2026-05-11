<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'task_name' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'nullable|date_format:H:i:s',
            'priority' => 'nullable|string',
            'id_tag' => 'nullable|integer|exists:tags,id_tag',
            'source' => 'nullable|string',
            'deskripsi' => 'nullable|string',
            'goals' => 'nullable|string',
            'goal_points' => 'nullable|array',
            'goal_points.*.id' => 'required|integer',
            'goal_points.*.text' => 'required|string',
            'goal_points.*.completed' => 'required|boolean',
            'progress' => 'nullable|integer|min:0|max:100',
            'status' => 'nullable|in:ongoing,completed',
        ];
    }
}
