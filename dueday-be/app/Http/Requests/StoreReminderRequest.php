<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReminderRequest extends FormRequest
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
            'isi_reminder' => 'nullable|string|max:255',
            'jenis' => 'nullable|in:task,activity',
            'waktu' => 'nullable|date_format:H:i:s',
            'suara_notifikasi' => 'nullable|string|max:255',
            'gaya_pesan' => 'nullable|in:motivasi,tegas,humor',
            'frekuensi' => 'nullable|integer|min:0',
            'getaran' => 'nullable|boolean',
        ];
    }
}
