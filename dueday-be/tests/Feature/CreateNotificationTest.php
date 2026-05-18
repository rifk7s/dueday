<?php

use App\Models\Notification;
use App\Models\User;

test('authenticated user can create a notification', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->postJson('/api/notifications', [
            'type' => 'reminder',
            'title' => 'Tugas jatuh tempo',
            'message' => 'Segera kerjakan tugasmu.',
            'is_read' => false,
        ]);

    $response->assertStatus(201);
    $response->assertJsonStructure([
        'id',
        'user_id',
        'type',
        'reference_id',
        'title',
        'message',
        'is_read',
        'created_at',
        'updated_at',
    ]);

    $this->assertDatabaseHas('notifications', [
        'title' => 'Tugas jatuh tempo',
        'user_id' => $user->id,
    ]);
});

test('notification requires a valid type', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->postJson('/api/notifications', [
            'title' => 'No type',
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('type');
});

test('unauthenticated user cannot create notification', function () {
    $response = $this->postJson('/api/notifications', [
        'type' => 'system',
    ]);

    $response->assertStatus(401);
});

test('authenticated user only sees their own notifications', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    Notification::factory()->count(2)->create(['user_id' => $user->id]);
    Notification::factory()->create(['user_id' => $otherUser->id]);

    $response = $this
        ->actingAs($user)
        ->getJson('/api/notifications');

    $response->assertStatus(200);
    expect($response->json())->toHaveCount(2);
});

test('authenticated user can get a specific notification', function () {
    $user = User::factory()->create();
    $notification = Notification::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->getJson("/api/notifications/{$notification->id}");

    $response->assertStatus(200);
    $response->assertJson(['id' => $notification->id]);
});

test('user cannot get another users notification', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $notification = Notification::factory()->create(['user_id' => $otherUser->id]);

    $response = $this
        ->actingAs($user)
        ->getJson("/api/notifications/{$notification->id}");

    $response->assertStatus(404);
});

test('authenticated user can mark their notification as read', function () {
    $user = User::factory()->create();
    $notification = Notification::factory()->create([
        'user_id' => $user->id,
        'is_read' => false,
    ]);

    $response = $this
        ->actingAs($user)
        ->patchJson("/api/notifications/{$notification->id}", [
            'is_read' => true,
        ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('notifications', [
        'id' => $notification->id,
        'is_read' => true,
    ]);
});

test('authenticated user can delete their notification', function () {
    $user = User::factory()->create();
    $notification = Notification::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->deleteJson("/api/notifications/{$notification->id}");

    $response->assertStatus(204);
    $this->assertDatabaseMissing('notifications', ['id' => $notification->id]);
});
