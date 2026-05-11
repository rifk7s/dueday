<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'task_name' => 'sometimes|string|max:255',
            'date' => 'sometimes|date',
            'time' => 'nullable|date_format:H:i:s',
            'priority' => 'nullable|string',
            'id_tag' => 'nullable|integer|exists:tags,id_tag',
            'source' => 'nullable|string',
            'deskripsi' => 'nullable|string',
            'progress' => 'nullable|integer|min:0|max:100',
            'ulangi' => 'nullable|in:setiap_hari,satu_minggu,satu_bulan,satu_tahun',
            'status' => 'nullable|in:ongoing,completed',
        ];
    }
}
