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
            'activity_name' => 'required|string|max:255',
            'tanggal' => 'nullable|date',
            'time_start' => 'nullable|date_format:H:i:s',
            'time_end' => 'nullable|date_format:H:i:s',
            'id_tag' => 'nullable|integer|exists:tags,id_tag',
            'status' => 'nullable|in:not_started,ongoing,pending,completed,cancelled',
            'progress' => 'nullable|integer|min:0|max:100',
            'deskripsi' => 'nullable|string',
            'ulangi' => 'nullable|in:setiap_hari,satu_minggu,satu_bulan,satu_tahun',
        ];
    }
}
