<?php

use App\Models\User;
use App\Models\Task;
use App\Services\TaskService;
use App\Repositories\TaskRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('task service creates task with user id', function () {
    $user = User::factory()->create();
    
    $service = new TaskService(new TaskRepository());
    
    $task = $service->createTask($user->id, [
        'name' => 'Test task',
        'due_date' => '2026-05-20',
        'priority' => 'high',
    ]);

    expect($task)->toBeInstanceOf(Task::class);
    expect($task->user_id)->toBe($user->id);
    expect($task->name)->toBe('Test task');
    expect($task->due_date->toDateString())->toBe('2026-05-20');
});

test('task service retrieves user tasks', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    
    Task::factory()->create(['user_id' => $user->id]);
    Task::factory()->create(['user_id' => $user->id]);
    Task::factory()->create(['user_id' => $otherUser->id]);
    
    $service = new TaskService(new TaskRepository());
    $tasks = $service->getUserTasks($user->id);

    expect($tasks)->toHaveCount(2);
    expect($tasks->every(fn ($task) => $task->user_id === $user->id))->toBeTrue();
});

test('task service returns null for task not owned by user', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    
    $task = Task::factory()->create(['user_id' => $otherUser->id]);
    
    $service = new TaskService(new TaskRepository());
    $result = $service->getTaskForUser($user->id, $task->id);

    expect($result)->toBeNull();
});
