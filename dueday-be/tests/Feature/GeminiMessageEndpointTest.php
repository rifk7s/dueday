<?php

use App\Models\User;
use App\Services\GeminiService;
use Illuminate\Support\Facades\Cache;

test('returns 200 with message from service', function () {
    Cache::flush();
    $this->mock(GeminiService::class, function ($mock) {
        $mock->shouldReceive('generateMessage')
            ->once()
            ->with('Tugas Kalkulus', '01 Jun 2026', 'tegas', 'h-minus-1')
            ->andReturn('Deadline mepet, kerjakan sekarang.');
    });

    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/api/reminders/generate-message', [
        'entity_name' => 'Tugas Kalkulus',
        'deadline' => '01 Jun 2026',
        'style' => 'tegas',
        'slot_label' => 'h-minus-1',
    ])->assertOk()->assertJson(['message' => 'Deadline mepet, kerjakan sekarang.']);
});

test('returns 503 when gemini service returns null', function () {
    Cache::flush();
    $this->mock(GeminiService::class, function ($mock) {
        $mock->shouldReceive('generateMessage')->once()->andReturn(null);
    });

    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/api/reminders/generate-message', [
        'entity_name' => 'Tugas',
        'style' => 'santai',
        'slot_label' => 'h-hari',
    ])->assertStatus(503)->assertJson(['error' => 'gemini_unavailable']);
});

test('rejects invalid style', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/api/reminders/generate-message', [
        'entity_name' => 'X',
        'style' => 'invalid',
        'slot_label' => 'h-hari',
    ])->assertStatus(422)->assertJsonValidationErrors('style');
});

test('requires entity_name and slot_label', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/api/reminders/generate-message', [
        'style' => 'tegas',
    ])->assertStatus(422)->assertJsonValidationErrors(['entity_name', 'slot_label']);
});

test('unauthenticated request rejected', function () {
    $this->postJson('/api/reminders/generate-message', [])->assertStatus(401);
});

test('caches successful single-message responses', function () {
    Cache::flush();
    $this->mock(GeminiService::class, function ($mock) {
        $mock->shouldReceive('generateMessage')->once()->andReturn('Kerjakan sekarang juga.');
    });

    $user = User::factory()->create();
    $payload = [
        'entity_name' => 'Tugas A',
        'deadline' => '02 Jun 2026',
        'style' => 'tegas',
        'slot_label' => 'h-minus-1',
    ];

    $this->actingAs($user)->postJson('/api/reminders/generate-message', $payload)
        ->assertOk()->assertJson(['message' => 'Kerjakan sekarang juga.']);

    // Second call must hit cache and not invoke the service again.
    $this->actingAs($user)->postJson('/api/reminders/generate-message', $payload)
        ->assertOk()->assertJson(['message' => 'Kerjakan sekarang juga.', 'cached' => true]);
});

test('batch endpoint mixes cached items with one batched generate call', function () {
    Cache::flush();
    $user = User::factory()->create();

    $warmHash = sha1(implode('|', ['Tugas A', '02 Jun 2026', 'tegas', 'h-minus-1']));
    Cache::put('gemini-msg:'.$warmHash, 'Sudah ada di cache.', 60);

    $this->mock(GeminiService::class, function ($mock) {
        $mock->shouldReceive('generateBatch')
            ->once()
            ->withArgs(function (array $items) {
                $keys = collect($items)->pluck('key')->all();

                return $keys === ['k2'];
            })
            ->andReturn(['k2' => 'Pesan baru dari Gemini.']);
    });

    $this->actingAs($user)->postJson('/api/reminders/generate-messages', [
        'items' => [
            ['key' => 'k1', 'entity_name' => 'Tugas A', 'deadline' => '02 Jun 2026', 'style' => 'tegas', 'slot_label' => 'h-minus-1'],
            ['key' => 'k2', 'entity_name' => 'Tugas B', 'deadline' => '03 Jun 2026', 'style' => 'santai', 'slot_label' => 'h-hari'],
        ],
    ])->assertOk()->assertJson([
        'messages' => [
            'k1' => 'Sudah ada di cache.',
            'k2' => 'Pesan baru dari Gemini.',
        ],
    ]);
});

test('batch endpoint omits items the service could not generate', function () {
    Cache::flush();
    $this->mock(GeminiService::class, function ($mock) {
        $mock->shouldReceive('generateBatch')->once()->andReturn([]);
    });

    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/reminders/generate-messages', [
        'items' => [
            ['key' => 'only', 'entity_name' => 'X', 'style' => 'tegas', 'slot_label' => 'h-hari'],
        ],
    ])->assertOk();

    expect($response->json('messages'))->toBe([]);
});

test('batch endpoint validates items', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/api/reminders/generate-messages', [
        'items' => [['key' => 'a', 'entity_name' => 'X', 'style' => 'nope', 'slot_label' => 'h-hari']],
    ])->assertStatus(422)->assertJsonValidationErrors('items.0.style');

    $this->actingAs($user)->postJson('/api/reminders/generate-messages', [
        'items' => [],
    ])->assertStatus(422)->assertJsonValidationErrors('items');
});

test('batch endpoint rejects duplicate keys', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/api/reminders/generate-messages', [
        'items' => [
            ['key' => 'dup', 'entity_name' => 'A', 'style' => 'tegas', 'slot_label' => 'h-hari'],
            ['key' => 'dup', 'entity_name' => 'B', 'style' => 'tegas', 'slot_label' => 'h-hari'],
        ],
    ])->assertStatus(422);
});
