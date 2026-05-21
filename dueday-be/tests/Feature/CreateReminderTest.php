<?php

use App\Models\Reminder;
use App\Models\User;

test('authenticated user can create a reminder', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->postJson('/api/reminders', [
            'isi_reminder' => 'Jangan lupa minum air',
            'jenis' => 'task',
            'waktu' => '08:00:00',
            'suara_notifikasi' => 'chime',
            'gaya_pesan' => 'santai',
            'frekuensi' => 3,
            'getaran' => true,
        ]);

    $response->assertStatus(201);
    $response->assertJsonStructure([
        'id',
        'user_id',
        'isi_reminder',
        'jenis',
        'waktu',
        'suara_notifikasi',
        'gaya_pesan',
        'frekuensi',
        'getaran',
        'created_at',
        'updated_at',
    ]);

    $this->assertDatabaseHas('reminders', [
        'isi_reminder' => 'Jangan lupa minum air',
        'user_id' => $user->id,
    ]);
});

test('reminder rejects invalid jenis', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->postJson('/api/reminders', [
            'jenis' => 'invalid',
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('jenis');
});

test('unauthenticated user cannot create reminder', function () {
    $response = $this->postJson('/api/reminders', [
        'isi_reminder' => 'Test',
    ]);

    $response->assertStatus(401);
});

test('authenticated user only sees their own reminders', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    Reminder::factory()->count(2)->create(['user_id' => $user->id]);
    Reminder::factory()->create(['user_id' => $otherUser->id]);

    $response = $this
        ->actingAs($user)
        ->getJson('/api/reminders');

    $response->assertStatus(200);
    expect($response->json())->toHaveCount(2);
});

test('authenticated user can get a specific reminder', function () {
    $user = User::factory()->create();
    $reminder = Reminder::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->getJson("/api/reminders/{$reminder->id}");

    $response->assertStatus(200);
    $response->assertJson(['id' => $reminder->id]);
});

test('user cannot get another users reminder', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $reminder = Reminder::factory()->create(['user_id' => $otherUser->id]);

    $response = $this
        ->actingAs($user)
        ->getJson("/api/reminders/{$reminder->id}");

    $response->assertStatus(404);
});

test('authenticated user can update their reminder', function () {
    $user = User::factory()->create();
    $reminder = Reminder::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->patchJson("/api/reminders/{$reminder->id}", [
            'isi_reminder' => 'Updated text',
        ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('reminders', [
        'id' => $reminder->id,
        'isi_reminder' => 'Updated text',
    ]);
});

test('authenticated user can delete their reminder', function () {
    $user = User::factory()->create();
    $reminder = Reminder::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->deleteJson("/api/reminders/{$reminder->id}");

    $response->assertStatus(204);
    $this->assertDatabaseMissing('reminders', ['id' => $reminder->id]);
});
