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
        if ($raw === null) {
            return null;
        }

        $cleaned = $this->sanitize($raw);

        return mb_strlen($cleaned) >= 10 ? $cleaned : null;
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
                    'temperature' => 0.85,
                    'maxOutputTokens' => 160,
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
}
