<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

test('forgot password returns a reset token for a known email', function () {
    $user = User::factory()->create([
        'email' => 'britney@example.com',
    ]);

    $response = $this->postJson('/api/forgot-password', [
        'email' => $user->email,
    ]);

    $response->assertOk();
    $response->assertJsonStructure(['message', 'email', 'token']);
    expect($response->json('email'))->toBe($user->email);
    expect($response->json('token'))->not->toBeEmpty();

    $this->assertDatabaseHas('password_reset_tokens', [
        'email' => $user->email,
    ]);
});

test('forgot password does not reveal whether an email is registered', function () {
    $response = $this->postJson('/api/forgot-password', [
        'email' => 'nobody@example.com',
    ]);

    $response->assertOk();
    $response->assertJsonMissing(['token']);
    expect($response->json('token'))->toBeNull();
    expect($response->json('email'))->toBeNull();
});

test('reset password updates the user password and revokes existing tokens', function () {
    $user = User::factory()->create([
        'email' => 'britney@example.com',
        'password' => Hash::make('old-password-123'),
    ]);

    $user->createToken('existing-session');

    $token = Password::broker()->createToken($user);

    $response = $this->postJson('/api/reset-password', [
        'email' => $user->email,
        'token' => $token,
        'password' => 'new-password-123',
        'password_confirmation' => 'new-password-123',
    ]);

    $response->assertOk();
    $response->assertJson([
        'message' => 'Password berhasil direset. Silakan masuk kembali.',
    ]);

    $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    expect($user->fresh()->tokens()->count())->toBe(0);
});

test('forgot password requires a valid email address', function () {
    $response = $this->postJson('/api/forgot-password', [
        'email' => 'not-an-email',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('email');
});
