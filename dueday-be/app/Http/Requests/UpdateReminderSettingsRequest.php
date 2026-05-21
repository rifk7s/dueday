<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReminderSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $section = [
            'time' => ['nullable', 'date_format:H:i'],
            'message' => ['nullable', 'string', 'max:255'],
            'style' => ['nullable', 'in:tegas,ngancam_halus,santai'],
            'sound' => ['nullable', 'in:default,chime,bell'],
            'vibrate' => ['nullable', 'boolean'],
        ];

        $rules = ['task' => ['sometimes', 'array'], 'activity' => ['sometimes', 'array']];
        foreach ($section as $field => $constraints) {
            $rules["task.{$field}"] = $constraints;
            $rules["activity.{$field}"] = $constraints;
        }

        return $rules;
    }
}
