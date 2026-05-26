<?php

use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Str;

test('authenticated user can create a task', function () {
    $user = User::factory()->create();
    $tag = Tag::factory()->create();

    $response = $this
        ->actingAs($user)
        ->postJson('/api/tasks', [
            'name' => 'Buy groceries',
            'due_date' => '2026-05-20',
            'due_time' => '14:30:00',
            'priority' => 'high',
            'tag_id' => $tag->id,
            'source' => 'manual',
            'description' => 'Buy milk, bread, and eggs',
            'goals' => "- [+] Buy milk\n- [+] Buy bread\n- [ ] Buy eggs",
            'status' => 'ongoing',
        ]);

    $response->assertStatus(201);
    $response->assertJsonStructure([
        'id',
        'user_id',
        'name',
        'due_date',
        'due_time',
        'priority',
        'status',
        'source',
        'description',
        'progress',
        'goals',
        'goal_points',
        'tag',
    ]);

    $this->assertDatabaseHas('tasks', [
        'name' => 'Buy groceries',
        'due_date' => '2026-05-20 00:00:00',
    ]);
});

test('task requires task_name', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->postJson('/api/tasks', [
            'due_date' => '2026-05-20',
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('name');
});

test('task requires deadline date', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->postJson('/api/tasks', [
            'name' => 'My task',
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('due_date');
});

test('unauthenticated user cannot create task', function () {
    $response = $this->postJson('/api/tasks', [
        'name' => 'My task',
        'due_date' => '2026-05-20',
    ]);

    $response->assertStatus(401);
});

test('authenticated user can get all their tasks', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $task1 = $user->tasks()->create([
        'id' => Str::uuid(),
        'name' => 'Task 1',
        'due_date' => '2026-05-20',
        'priority' => 'high',
    ]);

    $task2 = $user->tasks()->create([
        'id' => Str::uuid(),
        'name' => 'Task 2',
        'due_date' => '2026-05-25',
        'priority' => 'low',
    ]);

    $otherUserTask = $otherUser->tasks()->create([
        'id' => Str::uuid(),
        'name' => 'Other task',
        'due_date' => '2026-05-30',
        'priority' => 'medium',
    ]);

    $response = $this
        ->actingAs($user)
        ->getJson('/api/tasks');

    $response->assertStatus(200);
    expect($response->json())->toHaveCount(2);
    expect($response->json('*.name'))->toContain('Task 1', 'Task 2');
});

test('authenticated user can get a specific task', function () {
    $user = User::factory()->create();

    $task = $user->tasks()->create([
        'id' => Str::uuid(),
        'name' => 'My task',
        'due_date' => '2026-05-20',
        'priority' => 'high',
    ]);

    $response = $this
        ->actingAs($user)
        ->getJson("/api/tasks/{$task->id}");

    $response->assertStatus(200);
    $response->assertJson([
        'id' => $task->id,
        'name' => 'My task',
    ]);
});

test('user cannot get another users task', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $task = $otherUser->tasks()->create([
        'id' => Str::uuid(),
        'name' => 'Other task',
        'due_date' => '2026-05-20',
        'priority' => 'high',
    ]);

    $response = $this
        ->actingAs($user)
        ->getJson("/api/tasks/{$task->id}");

    $response->assertStatus(404);
});

test('unauthenticated user cannot get tasks', function () {
    $response = $this->getJson('/api/tasks');

    $response->assertStatus(401);
});
