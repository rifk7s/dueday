<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
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
            'subscription_id' => 'required|uuid|exists:subscriptions,id',
            'amount' => 'nullable|numeric|min:0',
            'method' => 'nullable|string|max:255',
            'status' => 'required|in:pending,paid,failed',
            'plan' => 'sometimes|nullable|string|in:satu_bulan,tiga_bulan,satu_tahun',
        ];
    }
}
