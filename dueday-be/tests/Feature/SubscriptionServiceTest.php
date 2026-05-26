<?php

use App\Models\Subscription;
use App\Models\User;
use App\Services\SubscriptionService;
use Carbon\Carbon;

test('activateOrExtendUserSubscription picks the latest-expiring active subscription when multiple exist', function () {
    $user = User::factory()->create();

    // Two active subscriptions for the same user — earlier one was created later in source
    // order so a naive .first() would return the wrong row.
    $earlier = Subscription::factory()->create([
        'user_id' => $user->id,
        'plan' => 'satu_bulan',
        'status' => 'active',
        'started_at' => Carbon::now()->subDays(20),
        'expired_at' => Carbon::now()->addDays(10),
    ]);

    $later = Subscription::factory()->create([
        'user_id' => $user->id,
        'plan' => 'satu_tahun',
        'status' => 'active',
        'started_at' => Carbon::now()->subDays(5),
        'expired_at' => Carbon::now()->addMonths(11),
    ]);

    app(SubscriptionService::class)->activateOrExtendUserSubscription($user->id, 'satu_tahun', 12);

    $later->refresh();
    $earlier->refresh();

    // The later-expiring subscription should have been extended by 12 months past its current expiry.
    expect(Carbon::parse($later->expired_at)->greaterThan(Carbon::now()->addMonths(22)))
        ->toBeTrue('later subscription should have been extended ~12 months past its existing expiry');

    // The earlier-expiring subscription must NOT have been touched.
    expect(Carbon::parse($earlier->expired_at)->isSameDay(Carbon::now()->addDays(10)))->toBeTrue();
});
