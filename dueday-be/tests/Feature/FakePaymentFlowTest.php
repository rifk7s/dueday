<?php

use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;

test('fake payment checkout and confirm updates payment status', function () {
    $user = User::factory()->create();
    $subscription = Subscription::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->postJson('/api/payments', [
            'subscription_id' => $subscription->id,
            'amount' => 50000,
            'method' => 'bca',
            'status' => 'pending',
        ]);

    $response->assertStatus(201);

    $paymentId = $response->json('id');

    // Visit fake checkout page
    $checkout = $this->actingAs($user)->get("/fake-pay/checkout/{$paymentId}");
    $checkout->assertStatus(200);

    // Confirm payment via fake gateway
    $confirm = $this->actingAs($user)->post("/fake-pay/confirm/{$paymentId}", [
        'status' => 'paid',
    ]);

    $confirm->assertStatus(200);

    $this->assertDatabaseHas('payments', [
        'id' => $paymentId,
        'status' => 'paid',
    ]);
});

test('fake payment index page shows payments', function () {
    $user = User::factory()->create();
    $subscription = Subscription::factory()->create(['user_id' => $user->id]);

    $payment = Payment::factory()->create([
        'user_id' => $user->id,
        'subscription_id' => $subscription->id,
        'status' => 'pending',
    ]);

    $response = $this->get('/fake-pay/payments');

    $response->assertStatus(200);
    $response->assertSee($payment->id);
    $response->assertSee('Open Checkout');
});
