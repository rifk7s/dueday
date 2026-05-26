<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'date' => 'sometimes|nullable|date',
            'anchor_date' => 'sometimes|nullable|date',
            'time_start' => 'sometimes|nullable|date_format:H:i:s',
            'time_end' => 'sometimes|nullable|date_format:H:i:s',
            'tag_id' => 'sometimes|nullable|integer|exists:tags,id',
            'status' => 'sometimes|nullable|in:not_started,ongoing,pending,completed,cancelled',
            'progress' => 'sometimes|nullable|integer|min:0|max:100',
            'progress_started_at' => 'sometimes|nullable|date',
            'description' => 'sometimes|nullable|string',
            'recurrence' => 'sometimes|nullable|in:daily,weekly,monthly,yearly',

            // CRITICAL FIX: Allow the flag to reach your service!
            'ubah_anchor' => 'sometimes|boolean',
        ];
    }
}
