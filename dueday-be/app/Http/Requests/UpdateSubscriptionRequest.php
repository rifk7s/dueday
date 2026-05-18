<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSubscriptionRequest extends FormRequest
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
            'plan' => 'sometimes|nullable|string|max:255',
            'status' => 'sometimes|required|in:active,expired,cancelled,pending',
            'started_at' => 'sometimes|nullable|date',
            'expired_at' => 'sometimes|nullable|date',
        ];
    }
}
