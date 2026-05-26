<?php

use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use App\Services\PaymentService;
use Carbon\Carbon;

test('paying an extend payment credits the duration of the chosen plan, not the previous subscription plan', function () {
    $user = User::factory()->create();

    // Existing subscription: 1-month plan, 5 days from expiring
    $expiredAt = Carbon::now()->addDays(5);
    $subscription = Subscription::factory()->create([
        'user_id' => $user->id,
        'plan' => 'satu_bulan',
        'status' => 'active',
        'started_at' => Carbon::now()->subDays(25),
        'expired_at' => $expiredAt,
    ]);

    // User chooses to extend with a 1-year plan and pays for it
    $payment = Payment::factory()->create([
        'user_id' => $user->id,
        'subscription_id' => $subscription->id,
        'plan' => 'satu_tahun',
        'status' => 'pending',
        'method' => 'bca',
        'amount' => 192000,
    ]);

    // Admin marks the payment as paid (triggers activateOrExtendUserSubscription)
    app(PaymentService::class)->updatePayment($user->id, $payment->id, ['status' => 'paid']);

    // Subscription should now be on the YEARLY plan and expire ~12 months past the original expiry
    $subscription->refresh();

    expect($subscription->plan)->toBe('satu_tahun');
    expect($subscription->status)->toBe('active');

    $expectedExpiry = $expiredAt->copy()->addMonths(12);
    expect(Carbon::parse($subscription->expired_at)->isSameDay($expectedExpiry))
        ->toBeTrue('expected new expiry on '.$expectedExpiry->toDateString().', got '.$subscription->expired_at);
});

test('paying an extend payment without a stored plan falls back to the subscription plan', function () {
    $user = User::factory()->create();

    $expiredAt = Carbon::now()->addDays(3);
    $subscription = Subscription::factory()->create([
        'user_id' => $user->id,
        'plan' => 'tiga_bulan',
        'status' => 'active',
        'started_at' => Carbon::now()->subDays(60),
        'expired_at' => $expiredAt,
    ]);

    // Legacy-shape payment row with no plan column persisted
    $payment = Payment::factory()->create([
        'user_id' => $user->id,
        'subscription_id' => $subscription->id,
        'plan' => null,
        'status' => 'pending',
        'method' => 'bca',
        'amount' => 49000,
    ]);

    app(PaymentService::class)->updatePayment($user->id, $payment->id, ['status' => 'paid']);

    $subscription->refresh();

    expect($subscription->plan)->toBe('tiga_bulan');
    $expectedExpiry = $expiredAt->copy()->addMonths(3);
    expect(Carbon::parse($subscription->expired_at)->isSameDay($expectedExpiry))->toBeTrue();
});
