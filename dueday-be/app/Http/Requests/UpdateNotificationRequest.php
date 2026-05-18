<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => 'sometimes|required|in:reminder,system,payment,info',
            'reference_id' => 'sometimes|nullable|uuid',
            'title' => 'sometimes|nullable|string|max:255',
            'message' => 'sometimes|nullable|string',
            'is_read' => 'sometimes|nullable|boolean',
        ];
    }
}
