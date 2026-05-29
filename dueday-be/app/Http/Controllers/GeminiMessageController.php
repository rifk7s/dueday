<?php

namespace App\Http\Controllers;

use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class GeminiMessageController extends Controller
{
    private const int CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

    // Public so Scramble can read it when statically evaluating the validation rules.
    public const int MAX_ITEMS_PER_REQUEST = 50;

    public function __construct(private readonly GeminiService $gemini) {}

    /**
     * Generate reminder message
     *
     * Generate a single reminder message for one entity. Identical requests are
     * served from cache and cost zero Gemini calls.
     */
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'entity_name' => ['required', 'string', 'max:255'],
            'deadline' => ['nullable', 'string', 'max:64'],
            'style' => ['required', 'in:tegas,ngancam_halus,santai'],
            'slot_label' => ['required', 'string', 'max:64'],
        ]);

        $cacheKey = $this->buildCacheKey($data['entity_name'], $data['deadline'] ?? null, $data['style'], $data['slot_label']);
        $cached = Cache::get($cacheKey);
        if (is_string($cached)) {
            return response()->json(['message' => $cached, 'cached' => true]);
        }

        $message = $this->gemini->generateMessage(
            $data['entity_name'],
            $data['deadline'] ?? null,
            $data['style'],
            $data['slot_label'],
        );

        if ($message === null) {
            return response()->json(['message' => null, 'error' => 'gemini_unavailable'], 503);
        }

        Cache::put($cacheKey, $message, self::CACHE_TTL_SECONDS);

        return response()->json(['message' => $message]);
    }

    /**
     * Batch generate reminder messages
     *
     * Accepts up to 50 items, returns a map keyed by the caller-supplied `key`.
     * Items served from cache cost zero Gemini calls; misses go through one
     * batched structured-output request.
     */
    public function generateBatch(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:'.self::MAX_ITEMS_PER_REQUEST],
            'items.*.key' => ['required', 'string', 'max:128', 'distinct'],
            'items.*.entity_name' => ['required', 'string', 'max:255'],
            'items.*.deadline' => ['nullable', 'string', 'max:64'],
            'items.*.style' => ['required', 'in:tegas,ngancam_halus,santai'],
            'items.*.slot_label' => ['required', 'string', 'max:64'],
        ]);

        $messages = [];
        $cacheKeyByItemKey = [];
        $misses = [];

        foreach ($data['items'] as $item) {
            $itemKey = (string) $item['key'];
            $cacheKey = $this->buildCacheKey($item['entity_name'], $item['deadline'] ?? null, $item['style'], $item['slot_label']);
            $cacheKeyByItemKey[$itemKey] = $cacheKey;

            $cached = Cache::get($cacheKey);
            if (is_string($cached)) {
                $messages[$itemKey] = $cached;

                continue;
            }
            $misses[] = [
                'key' => $itemKey,
                'entity_name' => (string) $item['entity_name'],
                'deadline' => $item['deadline'] ?? null,
                'style' => (string) $item['style'],
                'slot_label' => (string) $item['slot_label'],
            ];
        }

        if ($misses !== []) {
            $generated = $this->gemini->generateBatch($misses);
            foreach ($generated as $itemKey => $message) {
                if (! isset($cacheKeyByItemKey[$itemKey])) {
                    continue; // model hallucinated a key
                }
                $messages[$itemKey] = $message;
                Cache::put($cacheKeyByItemKey[$itemKey], $message, self::CACHE_TTL_SECONDS);
            }
        }

        return response()->json(['messages' => (object) $messages]);
    }

    private function buildCacheKey(string $entityName, ?string $deadline, string $style, string $slotLabel): string
    {
        $hash = sha1(implode('|', [$entityName, $deadline ?? '', $style, $slotLabel]));

        return 'gemini-msg:'.$hash;
    }
}
