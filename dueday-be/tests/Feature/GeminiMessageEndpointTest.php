<?php

use App\Models\User;
use App\Services\GeminiService;

test('returns 200 with message from service', function () {
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
