<?php

use App\Models\Tag;
use App\Models\User;

test('created tags are owned by the caller', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/tags', [
        'name' => 'Olahraga',
    ]);

    $response->assertStatus(201);
    $this->assertDatabaseHas('tags', [
        'name' => 'Olahraga',
        'user_id' => $user->id,
    ]);
});

test('tag list returns global tags plus only the callers own tags', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    $global = Tag::factory()->create(['user_id' => null]);
    $ownedByA = Tag::factory()->create(['user_id' => $userA->id]);
    $ownedByB = Tag::factory()->create(['user_id' => $userB->id]);

    $ids = collect(
        $this->actingAs($userA)->getJson('/api/tags')->assertOk()->json()
    )->pluck('id');

    expect($ids)->toContain($global->id)
        ->toContain($ownedByA->id)
        ->not->toContain($ownedByB->id);
});

test('a user cannot update another users tag', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $tag = Tag::factory()->create(['user_id' => $userA->id]);

    $this->actingAs($userB)
        ->putJson("/api/tags/{$tag->id}", ['name' => 'Hijacked'])
        ->assertNotFound();

    $this->assertDatabaseHas('tags', ['id' => $tag->id, 'name' => $tag->name]);
});

test('a user cannot delete another users tag', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $tag = Tag::factory()->create(['user_id' => $userA->id]);

    $this->actingAs($userB)
        ->deleteJson("/api/tags/{$tag->id}")
        ->assertNotFound();

    $this->assertDatabaseHas('tags', ['id' => $tag->id]);
});

test('global tags cannot be mutated by a user', function () {
    $user = User::factory()->create();
    $global = Tag::factory()->create(['user_id' => null]);

    $this->actingAs($user)
        ->putJson("/api/tags/{$global->id}", ['name' => 'Renamed'])
        ->assertNotFound();
});
