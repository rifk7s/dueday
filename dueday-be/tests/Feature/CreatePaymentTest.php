<?php

use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Str;

test('authenticated user can create a payment', function () {
    $user = User::factory()->create();
    $subscription = Subscription::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->postJson('/api/payments', [
            'subscription_id' => $subscription->id,
            'amount' => 49000,
            'method' => 'bank_transfer',
            'status' => 'paid',
        ]);

    $response->assertStatus(201);
    $response->assertJsonStructure([
        'id',
        'user_id',
        'subscription_id',
        'amount',
        'method',
        'status',
        'created_at',
        'updated_at',
    ]);

    $this->assertDatabaseHas('payments', [
        'subscription_id' => $subscription->id,
        'user_id' => $user->id,
        'status' => 'paid',
    ]);
});

test('payment requires an existing subscription_id', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->postJson('/api/payments', [
            'subscription_id' => (string) Str::uuid(),
            'status' => 'pending',
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('subscription_id');
});

test('payment requires a valid status', function () {
    $user = User::factory()->create();
    $subscription = Subscription::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->postJson('/api/payments', [
            'subscription_id' => $subscription->id,
            'status' => 'invalid',
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('status');
});

test('unauthenticated user cannot create payment', function () {
    $response = $this->postJson('/api/payments', [
        'status' => 'pending',
    ]);

    $response->assertStatus(401);
});

test('authenticated user only sees their own payments', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    Payment::factory()->count(2)->create(['user_id' => $user->id]);
    Payment::factory()->create(['user_id' => $otherUser->id]);

    $response = $this
        ->actingAs($user)
        ->getJson('/api/payments');

    $response->assertStatus(200);
    expect($response->json())->toHaveCount(2);
});

test('authenticated user can get a specific payment', function () {
    $user = User::factory()->create();
    $payment = Payment::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->getJson("/api/payments/{$payment->id}");

    $response->assertStatus(200);
    $response->assertJson(['id' => $payment->id]);
});

test('user cannot get another users payment', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $payment = Payment::factory()->create(['user_id' => $otherUser->id]);

    $response = $this
        ->actingAs($user)
        ->getJson("/api/payments/{$payment->id}");

    $response->assertStatus(404);
});

test('authenticated user can update their payment status', function () {
    $user = User::factory()->create();
    $payment = Payment::factory()->create([
        'user_id' => $user->id,
        'status' => 'pending',
    ]);

    $response = $this
        ->actingAs($user)
        ->patchJson("/api/payments/{$payment->id}", [
            'status' => 'paid',
        ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('payments', [
        'id' => $payment->id,
        'status' => 'paid',
    ]);
});

test('authenticated user can delete their payment', function () {
    $user = User::factory()->create();
    $payment = Payment::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->deleteJson("/api/payments/{$payment->id}");

    $response->assertStatus(204);
    $this->assertDatabaseMissing('payments', ['id' => $payment->id]);
});
