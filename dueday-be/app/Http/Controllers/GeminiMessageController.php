<?php

namespace App\Http\Controllers;

use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeminiMessageController extends Controller
{
    public function __construct(private readonly GeminiService $gemini) {}

    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'entity_name' => ['required', 'string', 'max:255'],
            'deadline' => ['nullable', 'string', 'max:64'],
            'style' => ['required', 'in:tegas,ngancam_halus,santai'],
            'slot_label' => ['required', 'string', 'max:64'],
        ]);

        $message = $this->gemini->generateMessage(
            $data['entity_name'],
            $data['deadline'] ?? null,
            $data['style'],
            $data['slot_label'],
        );

        if ($message === null) {
            return response()->json(['message' => null, 'error' => 'gemini_unavailable'], 503);
        }

        return response()->json(['message' => $message]);
    }
}
