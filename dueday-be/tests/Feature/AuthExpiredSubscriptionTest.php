<?php

use App\Models\User;
use App\Services\SubscriptionService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

it('marks an expired subscription as unsubscribed during login', function () {
    $user = User::query()->create([
        'name' => 'Expired Login User',
        'username' => 'expired_login_user',
        'email' => 'expired-login@test.local',
        'nim' => '0806010999',
        'password' => 'Password123',
        'is_subscribed' => true,
    ]);

    $subscriptionId = (string) Str::uuid();

    DB::table('subscriptions')->insert([
        'id' => $subscriptionId,
        'user_id' => $user->id,
        'plan' => 'satu_bulan',
        'status' => 'active',
        'started_at' => now()->subMonths(2),
        'expired_at' => now()->subDay(),
        'created_at' => now()->subMonths(2),
        'updated_at' => now()->subMonths(2),
    ]);

    $this->postJson('/api/login', [
        'username' => $user->username,
        'password' => 'Password123',
    ])
        ->assertOk()
        ->assertJsonPath('user.status', 'unsubscribed')
        ->assertJsonPath('user.is_subscribed', false)
        ->assertJsonPath('user.subscription_end', null);

    expect($user->refresh()->is_subscribed)->toBeFalse();

    // The lazy serialization path must converge with the scheduled command: the stale row is
    // expired, not left lingering as 'active'.
    expect(DB::table('subscriptions')->where('id', $subscriptionId)->value('status'))->toBe('expired');
});

it('bases a re-subscribe on now after the lazy path expired the old row', function () {
    $user = User::query()->create([
        'name' => 'Lapsed User',
        'username' => 'lapsed_user',
        'email' => 'lapsed@test.local',
        'nim' => '0806010777',
        'password' => 'Password123',
        'is_subscribed' => true,
    ]);

    DB::table('subscriptions')->insert([
        'id' => (string) Str::uuid(),
        'user_id' => $user->id,
        'plan' => 'satu_bulan',
        'status' => 'active',
        'started_at' => now()->subMonths(4),
        'expired_at' => now()->subMonths(3),
        'created_at' => now()->subMonths(4),
        'updated_at' => now()->subMonths(4),
    ]);

    // Serialize the user (login) so the lazy path runs and expires the old row.
    $this->postJson('/api/login', [
        'username' => $user->username,
        'password' => 'Password123',
    ])->assertOk();

    // Re-subscribing for one month must compute expiry from now, not the 3-month-old expired_at.
    app(SubscriptionService::class)->activateOrExtendUserSubscription($user->id, 'satu_bulan', 1);

    $newExpiry = DB::table('subscriptions')
        ->where('user_id', $user->id)
        ->where('status', 'active')
        ->value('expired_at');

    expect($newExpiry)->not->toBeNull();
    expect(Carbon::parse($newExpiry)->isFuture())->toBeTrue();
    expect(Carbon::parse($newExpiry)->between(now()->addMonth()->subDay(), now()->addMonth()->addDay()))->toBeTrue();
});
