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

    private const int MAX_BATCH_SIZE = 25;

    private const int RETRY_ATTEMPTS = 3;

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

        $raw = $this->callTextApi($apiKey, $this->buildPrompt($entityName, $entityDeadline, $style, $slotLabel));
        if ($raw === null) {
            return null;
        }

        $cleaned = $this->sanitize($raw);

        return mb_strlen($cleaned) >= 10 ? $cleaned : null;
    }

    /**
     * Generate many reminder messages in a single Gemini request via structured
     * output. Returns a map keyed by the caller-supplied `key` field; missing
     * entries mean the caller should fall back to a local template for that key.
     *
     * @param  list<array{key: string, entity_name: string, deadline: ?string, style: string, slot_label: string}>  $items
     * @return array<string, string>
     */
    public function generateBatch(array $items): array
    {
        $items = array_values($items);
        if ($items === []) {
            return [];
        }

        $apiKey = (string) config('services.gemini.key', '');
        if ($apiKey === '') {
            Log::warning('Gemini API key not configured');

            return [];
        }

        $results = [];
        foreach (array_chunk($items, self::MAX_BATCH_SIZE) as $chunk) {
            $chunkResults = $this->callJsonApi($apiKey, $this->buildBatchPrompt($chunk));
            foreach ($chunkResults as $key => $message) {
                $cleaned = $this->sanitize($message);
                if (mb_strlen($cleaned) >= 10) {
                    $results[$key] = $cleaned;
                }
            }
        }

        return $results;
    }

    /**
     * Strip leading metadata Gemini sometimes prepends (parenthesized notes,
     * leading dates, surrounding quotes), collapse whitespace, and cap length.
     */
    private const LEADING_LABELS = ['reminder', 'catatan', 'note', 'pengingat', 'info'];

    private const LEADING_TIME_WORDS = [
        'jan', 'januari', 'feb', 'februari', 'mar', 'maret', 'apr', 'april',
        'mei', 'may', 'jun', 'juni', 'june', 'jul', 'juli', 'july',
        'agu', 'agustus', 'aug', 'august', 'sep', 'september',
        'okt', 'oktober', 'oct', 'october', 'nov', 'november', 'des', 'desember', 'dec', 'december',
        'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu',
        'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
    ];

    private function sanitize(string $raw): string
    {
        $value = trim($raw);
        // Iteratively strip leading metadata: markdown punctuation, parens/brackets,
        // labels, time words, separators. Gemini stacks these in unpredictable
        // orders so we loop until nothing more is stripped.
        for ($i = 0; $i < 6; $i++) {
            $before = $value;
            $value = preg_replace('/^\s*[*_`#~>\-–—:]+\s*/u', '', $value) ?? $value;
            $value = preg_replace('/^\s*[(\[][^)\]]*[)\]]\s*[:,\-–—]?\s*/u', '', $value) ?? $value;
            $value = $this->stripLeadingWord(self::LEADING_LABELS, $value, '\s*[:\-–—]?\s*');
            $value = $this->stripLeadingWord(self::LEADING_TIME_WORDS, $value, '[^\p{L}]{0,30}');
            if ($before === $value) {
                break;
            }
        }
        // Remove any remaining markdown emphasis chars anywhere (not just leading).
        $value = preg_replace('/[*_`]{1,3}/u', '', $value) ?? $value;
        $value = preg_replace('/^["\'`“”‘’]+|["\'`“”‘’]+$/u', '', $value) ?? $value;
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

        return mb_substr(trim($value), 0, self::MAX_MESSAGE_CHARS);
    }

    /**
     * @param  list<string>  $words
     */
    private function stripLeadingWord(array $words, string $value, string $trailingPattern): string
    {
        $alternation = implode('|', array_map(preg_quote(...), $words));
        $pattern = '/^\s*(?:'.$alternation.')\b'.$trailingPattern.'/iu';

        return preg_replace($pattern, '', $value) ?? $value;
    }

    private function callTextApi(string $apiKey, string $prompt): ?string
    {
        $body = [
            'contents' => [['parts' => [['text' => $prompt]]]],
            'generationConfig' => [
                'temperature' => 0.85,
                'maxOutputTokens' => 160,
            ],
        ];

        $raw = $this->postWithRetryAndFallback($apiKey, $body);

        return is_string($raw) ? $raw : null;
    }

    /**
     * Single-shot batched Gemini call with structured JSON output. Returns map
     * of caller-supplied key => message text.
     *
     * @param  list<array{key: string, entity_name: string, deadline: ?string, style: string, slot_label: string}>  $chunk
     * @return array<string, string>
     */
    private function callJsonApi(string $apiKey, string $prompt): array
    {
        $body = [
            'contents' => [['parts' => [['text' => $prompt]]]],
            'generationConfig' => [
                'temperature' => 0.85,
                'maxOutputTokens' => max(256, self::MAX_BATCH_SIZE * 120),
                'responseMimeType' => 'application/json',
                'responseSchema' => [
                    'type' => 'ARRAY',
                    'items' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'key' => ['type' => 'STRING'],
                            'message' => ['type' => 'STRING'],
                        ],
                        'required' => ['key', 'message'],
                    ],
                ],
            ],
        ];

        $raw = $this->postWithRetryAndFallback($apiKey, $body);
        if (! is_string($raw)) {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            Log::warning('Gemini batch returned non-array JSON', ['raw' => mb_substr($raw, 0, 200)]);

            return [];
        }

        $out = [];
        foreach ($decoded as $entry) {
            if (! is_array($entry)) {
                continue;
            }
            $key = $entry['key'] ?? null;
            $message = $entry['message'] ?? null;
            if (is_string($key) && is_string($message)) {
                $out[$key] = $message;
            }
        }

        return $out;
    }

    /**
     * POST to Gemini with exponential backoff on 429/5xx, then fall back to a
     * lighter model (flash-lite) if the primary keeps failing. Returns the
     * first `candidates.0.content.parts.0.text` value seen, or null.
     */
    private function postWithRetryAndFallback(string $apiKey, array $body): ?string
    {
        $primary = (string) config('services.gemini.model', 'gemini-flash-latest');
        $fallback = (string) config('services.gemini.fallback_model', 'gemini-flash-lite-latest');

        foreach (array_unique([$primary, $fallback]) as $model) {
            $text = $this->postWithRetry($apiKey, $model, $body);
            if ($text !== null) {
                return $text;
            }
        }

        return null;
    }

    private function postWithRetry(string $apiKey, string $model, array $body): ?string
    {
        $endpoint = str_replace('{model}', $model, self::ENDPOINT);
        $delayMs = 500;

        for ($attempt = 1; $attempt <= self::RETRY_ATTEMPTS; $attempt++) {
            try {
                $response = Http::withHeaders([
                    'x-goog-api-key' => $apiKey,
                    'Content-Type' => 'application/json',
                ])->timeout(self::TIMEOUT_SECONDS)->post($endpoint, $body);
            } catch (Throwable $e) {
                Log::warning('Gemini request threw', ['model' => $model, 'attempt' => $attempt, 'error' => $e->getMessage()]);
                $this->sleepMs($delayMs);
                $delayMs *= 2;

                continue;
            }

            if ($response->successful()) {
                $raw = $response->json('candidates.0.content.parts.0.text');

                return is_string($raw) ? $raw : null;
            }

            $status = $response->status();
            $isRetriable = $status === 429 || ($status >= 500 && $status < 600);
            Log::warning('Gemini non-200', ['model' => $model, 'status' => $status, 'attempt' => $attempt]);
            if (! $isRetriable) {
                return null;
            }

            $this->sleepMs($delayMs);
            $delayMs *= 2;
        }

        return null;
    }

    private function sleepMs(int $ms): void
    {
        usleep($ms * 1000);
    }

    private function buildPrompt(string $entityName, ?string $entityDeadline, string $style, string $slotLabel): string
    {
        $deadline = $entityDeadline ?? 'tidak ditentukan';
        $maxChars = self::MAX_MESSAGE_CHARS;
        $styleHint = $this->styleHint($style);

        return <<<PROMPT
Tulis 1 pesan pengingat singkat untuk mahasiswa Indonesia. Target: "{$entityName}", deadline {$deadline}.
Gaya nada (jangan disebut/diulang di output): {$styleHint}. Konteks slot: {$slotLabel}.
Output WAJIB Bahasa Indonesia kasual mahasiswa, 1 baris, maksimal {$maxChars} karakter.

LARANGAN KERAS (kalau dilanggar, output dianggap gagal):
- DILARANG menulis dalam Bahasa Inggris atau mencampur Bahasa Inggris.
- DILARANG memakai markdown apapun: tanpa "*", "**", "_", "`", "#", ">".
- DILARANG mengulang/men-translate kata gaya seperti "tegas", "polite", "pressuring", "santai", "ngancam", dll.
- DILARANG memberi label/prefix: tanpa "Reminder:", "Catatan:", "Note:", "Pengingat:", "Style:".
- DILARANG mulai dengan "(", "[", tanda kutip, tanggal, jam, hari, atau bulan.
- DILARANG menambah penjelasan, salam, atau emoji.

Contoh format yang benar (jangan disalin, hanya pola):
- "Lanjutin {$entityName} jangan ditunda terus, deadlinenya nempel."
- "Kerjain {$entityName} sekarang biar ga keteteran besok."

Keluarkan HANYA kalimat pesannya, satu baris saja.
PROMPT;
    }

    /**
     * @param  list<array{key: string, entity_name: string, deadline: ?string, style: string, slot_label: string}>  $items
     */
    private function buildBatchPrompt(array $items): string
    {
        $maxChars = self::MAX_MESSAGE_CHARS;
        $payload = [];
        foreach ($items as $item) {
            $payload[] = [
                'key' => $item['key'],
                'entity_name' => $item['entity_name'],
                'deadline' => $item['deadline'] ?? 'tidak ditentukan',
                'style' => $item['style'],
                'style_hint' => $this->styleHint($item['style']),
                'slot_label' => $item['slot_label'],
            ];
        }
        $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        return <<<PROMPT
Kamu menulis pesan pengingat untuk mahasiswa Indonesia. Output WAJIB array JSON sesuai schema, satu objek per input.
Untuk SETIAP item di input, hasilkan 1 pesan pengingat Bahasa Indonesia kasual mahasiswa, 1 baris, maksimal {$maxChars} karakter.
Gunakan field "entity_name" sebagai subjek pesan, "style_hint" sebagai nada, "slot_label" sebagai konteks waktu/posisi pengingat.

LARANGAN KERAS untuk setiap message:
- DILARANG menulis dalam Bahasa Inggris atau mencampur Bahasa Inggris.
- DILARANG memakai markdown ("*", "**", "_", "`", "#", ">").
- DILARANG mengulang/menerjemahkan kata gaya (tegas, polite, pressuring, santai, ngancam, dst.).
- DILARANG memberi label/prefix (Reminder:, Catatan:, Note:, Pengingat:, Style:).
- DILARANG mulai dengan "(", "[", tanda kutip, tanggal, jam, hari, atau bulan.
- DILARANG menambah penjelasan, salam, atau emoji.

PENTING: pasangkan setiap output dengan "key" persis sama seperti pada input. Jangan tambahkan key baru, jangan skip item.

Input items (JSON):
{$payloadJson}
PROMPT;
    }

    private function styleHint(string $style): string
    {
        return match ($style) {
            'tegas' => 'tegas, lugas, sedikit memerintah',
            'ngancam_halus' => 'sopan tapi menekan, sindiran ringan tentang konsekuensi',
            'santai' => 'santai, kasual, ringan',
            default => 'netral',
        };
    }
}
