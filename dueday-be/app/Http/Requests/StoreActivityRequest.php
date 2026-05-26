<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'date' => 'nullable|date',
            'anchor_date' => 'sometimes|nullable|date',
            'time_start' => 'nullable|date_format:H:i:s',
            'time_end' => 'nullable|date_format:H:i:s',
            'tag_id' => 'nullable|integer|exists:tags,id',
            'status' => 'nullable|in:not_started,ongoing,pending,completed,cancelled',
            'progress' => 'nullable|integer|min:0|max:100',
            'description' => 'nullable|string',
            'recurrence' => 'nullable|in:daily,weekly,monthly,yearly',
        ];
    }
}
