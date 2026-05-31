<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

it('expires overdue active subscriptions and clears the subscribed flag', function () {
    $user = User::query()->create([
        'name' => 'Expiry Test User',
        'username' => 'expiry_test_user',
        'email' => 'expiry-test@test.local',
        'nim' => '0806010888',
        'password' => 'Password123',
        'is_subscribed' => true,
    ]);

    DB::table('subscriptions')->insert([
        'id' => (string) Str::uuid(),
        'user_id' => $user->id,
        'plan' => 'satu_bulan',
        'status' => 'active',
        'started_at' => now()->subMonths(2),
        'expired_at' => now()->subDay(),
        'created_at' => now()->subMonths(2),
        'updated_at' => now()->subMonths(2),
    ]);

    Artisan::call('subscriptions:expire-expired');

    expect(DB::table('subscriptions')->where('user_id', $user->id)->value('status'))->toBe('expired');
    expect($user->refresh()->is_subscribed)->toBeFalse();
});
