<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class GeminiService
{
    private const string ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent';

    private const int TIMEOUT_SECONDS = 15;

    private const int MAX_MESSAGE_CHARS = 80;

    /**
     * Generate a single reminder message in Bahasa Indonesia for one slot.
     * Returns null on any failure so the FE can fall back to a local template.
     */
    public function generateMessage(string $entityName, ?string $entityDeadline, string $style, string $slotLabel): ?string
    {
        $apiKey = (string) config('services.gemini.key', '');
        if ($apiKey === '') {
            Log::warning('Gemini API key not configured');

            return null;
        }

        $raw = $this->callApi($apiKey, $this->buildPrompt($entityName, $entityDeadline, $style, $slotLabel));

        return $raw === null ? null : mb_substr(trim($raw), 0, self::MAX_MESSAGE_CHARS);
    }

    private function callApi(string $apiKey, string $prompt): ?string
    {
        $model = (string) config('services.gemini.model', 'gemini-flash-latest');
        $endpoint = str_replace('{model}', $model, self::ENDPOINT);

        try {
            $response = Http::withHeaders([
                'x-goog-api-key' => $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(self::TIMEOUT_SECONDS)->post($endpoint, [
                'contents' => [
                    ['parts' => [['text' => $prompt]]],
                ],
                'generationConfig' => [
                    'temperature' => 0.9,
                    'maxOutputTokens' => 80,
                ],
            ]);
        } catch (Throwable $e) {
            Log::warning('Gemini request failed', ['error' => $e->getMessage()]);

            return null;
        }

        if (! $response->successful()) {
            Log::warning('Gemini non-200 response', ['status' => $response->status()]);

            return null;
        }

        $raw = $response->json('candidates.0.content.parts.0.text');

        return is_string($raw) ? $raw : null;
    }

    private function buildPrompt(string $entityName, ?string $entityDeadline, string $style, string $slotLabel): string
    {
        $deadline = $entityDeadline ?? 'tidak ditentukan';
        $maxChars = self::MAX_MESSAGE_CHARS;
        $styleHint = match ($style) {
            'tegas' => 'tegas, lugas, sedikit memerintah',
            'ngancam_halus' => 'sopan tapi menekan, sindiran ringan tentang konsekuensi',
            'santai' => 'santai, kasual, ringan',
            default => 'netral',
        };

        return <<<PROMPT
Tulis 1 pesan pengingat singkat dalam Bahasa Indonesia untuk "{$entityName}" dengan deadline {$deadline}.
Gaya: {$styleHint}. Konteks waktu: {$slotLabel}.
Maks {$maxChars} karakter. Tanpa emoji. Tanpa salam. Langsung, kontekstual.
Hanya keluarkan pesan saja, tanpa tanda kutip dan tanpa penjelasan.
PROMPT;
    }
}
