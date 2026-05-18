<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotificationRequest extends FormRequest
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
            'type' => 'required|in:reminder,system,payment,info',
            'reference_id' => 'nullable|uuid',
            'title' => 'nullable|string|max:255',
            'message' => 'nullable|string',
            'is_read' => 'nullable|boolean',
        ];
    }
}
