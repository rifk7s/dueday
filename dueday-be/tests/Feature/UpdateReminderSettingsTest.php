<?php

use App\Models\User;

test('show returns default empty settings', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson('/api/me/reminder-settings');

    $response->assertOk()
        ->assertJson([
            'task' => ['time' => null, 'message' => null, 'style' => null, 'sound' => null, 'vibrate' => false],
            'activity' => ['time' => null, 'message' => null, 'style' => null, 'sound' => null, 'vibrate' => false],
        ]);
});

test('update persists task settings and returns them', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->putJson('/api/me/reminder-settings', [
        'task' => [
            'time' => '09:30',
            'style' => 'tegas',
            'sound' => 'chime',
            'vibrate' => true,
            'message' => 'Manual override',
        ],
    ]);

    $response->assertOk()
        ->assertJsonPath('task.time', '09:30')
        ->assertJsonPath('task.style', 'tegas')
        ->assertJsonPath('task.sound', 'chime')
        ->assertJsonPath('task.vibrate', true)
        ->assertJsonPath('task.message', 'Manual override')
        ->assertJsonPath('activity.time', null);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'reminder_task_time' => '09:30',
        'reminder_task_style' => 'tegas',
        'reminder_task_vibrate' => true,
    ]);
});

test('update with both sections persists both', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->putJson('/api/me/reminder-settings', [
        'task' => ['time' => '07:00', 'style' => 'santai'],
        'activity' => ['time' => '08:00', 'sound' => 'bell'],
    ])->assertOk();

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'reminder_task_time' => '07:00',
        'reminder_task_style' => 'santai',
        'reminder_activity_time' => '08:00',
        'reminder_activity_sound' => 'bell',
    ]);
});

test('update rejects invalid time format', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->putJson('/api/me/reminder-settings', [
        'task' => ['time' => '9am'],
    ])->assertStatus(422)->assertJsonValidationErrors('task.time');
});

test('update rejects invalid style enum', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->putJson('/api/me/reminder-settings', [
        'task' => ['style' => 'motivasi'],
    ])->assertStatus(422)->assertJsonValidationErrors('task.style');
});

test('unauthenticated request rejected', function () {
    $this->getJson('/api/me/reminder-settings')->assertStatus(401);
    $this->putJson('/api/me/reminder-settings', [])->assertStatus(401);
});
