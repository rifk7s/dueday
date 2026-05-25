<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentRequest extends FormRequest
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
            'subscription_id' => 'sometimes|required|uuid|exists:subscriptions,id',
            'amount' => 'sometimes|nullable|numeric|min:0',
            'method' => 'sometimes|nullable|string|max:255',
            'status' => 'sometimes|required|in:pending,paid,failed',
        ];
    }
}
