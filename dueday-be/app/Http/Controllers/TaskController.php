<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Services\TaskService;

class TaskController extends Controller
{
    public function __construct(
        private TaskService $taskService
    ) {
    }

    /**
     * Get all tasks for the authenticated user.
     */
    public function index()
    {
        $tasks = $this->taskService->getUserTasks(auth()->id());

        return TaskResource::collection($tasks);
    }

    /**
     * Get a specific task by ID.
     */
    public function show(Task $task)
    {
        $task = $this->taskService->getTaskForUser(auth()->id(), $task->{$task->getKeyName()});

        if (! $task) {
            return response(['message' => 'Task not found'], 404);
        }

        return new TaskResource($task);
    }

    /**
     * Store a newly created task in storage.
     */
    public function store(StoreTaskRequest $request)
    {
        $task = $this->taskService->createTask(
            auth()->id(),
            $request->validated()
        );

        return (new TaskResource($task))->response()->setStatusCode(201);
    }

    /**
     * Update a task for the authenticated user.
     */
    public function update(UpdateTaskRequest $request, Task $task)
    {
        $task = $this->taskService->updateTask(auth()->id(), $task->{$task->getKeyName()}, $request->validated());

        if (! $task) {
            return response(['message' => 'Task not found or not owned by user'], 404);
        }

        return new TaskResource($task);
    }

    /**
     * Delete a task for the authenticated user.
     */
    public function destroy(Task $task)
    {
        $deleted = $this->taskService->deleteTask(auth()->id(), $task->{$task->getKeyName()});

        if (! $deleted) {
            return response(['message' => 'Task not found or not owned by user'], 404);
        }

        return response(null, 204);
    }
}
