<?php

use App\Models\Subscription;
use App\Models\User;

test('authenticated user can create a subscription', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->postJson('/api/subscriptions', [
            'plan' => 'satu_bulan',
            'status' => 'active',
            'started_at' => '2026-05-01 00:00:00',
            'expired_at' => '2026-06-01 00:00:00',
        ]);

    $response->assertStatus(201);
    $response->assertJsonStructure([
        'id',
        'user_id',
        'plan',
        'status',
        'started_at',
        'expired_at',
        'created_at',
        'updated_at',
    ]);

    $this->assertDatabaseHas('subscriptions', [
        'plan' => 'satu_bulan',
        'user_id' => $user->id,
    ]);
});

test('subscription requires a valid status', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->postJson('/api/subscriptions', [
            'plan' => 'satu_bulan',
            'status' => 'bogus',
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('status');
});

test('unauthenticated user cannot create subscription', function () {
    $response = $this->postJson('/api/subscriptions', [
        'status' => 'active',
    ]);

    $response->assertStatus(401);
});

test('authenticated user only sees their own subscriptions', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    Subscription::factory()->count(2)->create(['user_id' => $user->id]);
    Subscription::factory()->create(['user_id' => $otherUser->id]);

    $response = $this
        ->actingAs($user)
        ->getJson('/api/subscriptions');

    $response->assertStatus(200);
    expect($response->json())->toHaveCount(2);
});

test('authenticated user can get a specific subscription', function () {
    $user = User::factory()->create();
    $subscription = Subscription::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->getJson("/api/subscriptions/{$subscription->id}");

    $response->assertStatus(200);
    $response->assertJson(['id' => $subscription->id]);
});

test('user cannot get another users subscription', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $subscription = Subscription::factory()->create(['user_id' => $otherUser->id]);

    $response = $this
        ->actingAs($user)
        ->getJson("/api/subscriptions/{$subscription->id}");

    $response->assertStatus(404);
});

test('authenticated user can update their subscription status', function () {
    $user = User::factory()->create();
    $subscription = Subscription::factory()->create([
        'user_id' => $user->id,
        'status' => 'active',
    ]);

    $response = $this
        ->actingAs($user)
        ->patchJson("/api/subscriptions/{$subscription->id}", [
            'status' => 'cancelled',
        ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('subscriptions', [
        'id' => $subscription->id,
        'status' => 'cancelled',
    ]);
});

test('authenticated user can delete their subscription', function () {
    $user = User::factory()->create();
    $subscription = Subscription::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->deleteJson("/api/subscriptions/{$subscription->id}");

    $response->assertStatus(204);
    $this->assertDatabaseMissing('subscriptions', ['id' => $subscription->id]);
});
