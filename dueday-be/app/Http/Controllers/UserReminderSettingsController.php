<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateReminderSettingsRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserReminderSettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($this->serialize($request->user()));
    }

    public function update(UpdateReminderSettingsRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        foreach (['task', 'activity'] as $type) {
            if (! isset($data[$type]) || ! is_array($data[$type])) {
                continue;
            }
            $payload = [];
            foreach (['time', 'message', 'style', 'sound', 'vibrate'] as $field) {
                if (array_key_exists($field, $data[$type])) {
                    $payload["reminder_{$type}_{$field}"] = $data[$type][$field];
                }
            }
            if ($payload !== []) {
                $user->fill($payload);
            }
        }

        $user->save();

        return response()->json($this->serialize($user));
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function serialize(User $user): array
    {
        return [
            'task' => [
                'time' => $user->reminder_task_time,
                'message' => $user->reminder_task_message,
                'style' => $user->reminder_task_style,
                'sound' => $user->reminder_task_sound,
                'vibrate' => (bool) $user->reminder_task_vibrate,
            ],
            'activity' => [
                'time' => $user->reminder_activity_time,
                'message' => $user->reminder_activity_message,
                'style' => $user->reminder_activity_style,
                'sound' => $user->reminder_activity_sound,
                'vibrate' => (bool) $user->reminder_activity_vibrate,
            ],
        ];
    }
}
