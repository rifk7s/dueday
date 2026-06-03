<?php

use App\Models\User;

test('update persists language and returns it', function () {
    $user = User::factory()->create(['language' => 'Indonesia']);

    $response = $this->actingAs($user)->patchJson('/api/me', [
        'language' => 'English',
    ]);

    $response->assertOk()
        ->assertJsonPath('language', 'English');

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'language' => 'English',
    ]);
});

test('update rejects unsupported language', function () {
    $user = User::factory()->create(['language' => 'Indonesia']);

    $this->actingAs($user)->patchJson('/api/me', [
        'language' => 'Klingon',
    ])->assertStatus(422)->assertJsonValidationErrors('language');

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'language' => 'Indonesia',
    ]);
});

test('update with nickname only still works', function () {
    $user = User::factory()->create(['nickname' => 'Asep']);

    $response = $this->actingAs($user)->patchJson('/api/me', [
        'nickname' => 'Budi',
    ]);

    $response->assertOk()
        ->assertJsonPath('nickname', 'Budi');

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'nickname' => 'Budi',
    ]);
});
