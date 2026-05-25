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
            'activity_name' => 'sometimes|required|string|max:255',
            'tanggal' => 'sometimes|nullable|date',
            'anchor_date' => 'sometimes|nullable|date',
            'time_start' => 'sometimes|nullable|date_format:H:i:s',
            'time_end' => 'sometimes|nullable|date_format:H:i:s',
            'id_tag' => 'sometimes|nullable|integer|exists:tags,id_tag',
            'status' => 'sometimes|nullable|in:not_started,ongoing,pending,completed,cancelled',
            'progress' => 'sometimes|nullable|integer|min:0|max:100',
            'progress_started_at' => 'sometimes|nullable|date',
            'deskripsi' => 'sometimes|nullable|string',
            'ulangi' => 'sometimes|nullable|in:setiap_hari,satu_minggu,satu_bulan,satu_tahun',

            // CRITICAL FIX: Allow the flag to reach your service!
            'ubah_anchor' => 'sometimes|boolean',
        ];
    }
}
