<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReminderRequest extends FormRequest
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
            'isi_reminder' => 'sometimes|nullable|string|max:255',
            'jenis' => 'sometimes|nullable|in:task,activity',
            'waktu' => 'sometimes|nullable|date_format:H:i:s',
            'suara_notifikasi' => 'sometimes|nullable|in:default,chime,bell',
            'gaya_pesan' => 'sometimes|nullable|in:tegas,ngancam_halus,santai',
            'frekuensi' => 'sometimes|nullable|integer|min:0',
            'getaran' => 'sometimes|nullable|boolean',
        ];
    }
}
