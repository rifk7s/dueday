<?php

use App\Models\User;
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

    $this->postJson('/api/login', [
        'username' => $user->username,
        'password' => 'Password123',
    ])
        ->assertOk()
        ->assertJsonPath('user.status', 'unsubscribed')
        ->assertJsonPath('user.is_subscribed', false);

    expect($user->refresh()->is_subscribed)->toBeFalse();
});
