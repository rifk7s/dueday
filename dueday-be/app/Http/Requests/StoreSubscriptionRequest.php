<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubscriptionRequest extends FormRequest
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
            'plan' => 'nullable|string|max:255',
            'status' => 'required|in:active,expired,cancelled,pending',
            'started_at' => 'nullable|date',
            'expired_at' => 'nullable|date',
        ];
    }
}
