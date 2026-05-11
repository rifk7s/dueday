<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Services\TaskService;
use Illuminate\Http\Response;

class TaskController extends Controller
{
    public function __construct(
        private TaskService $taskService
    ) {}

    /**
     * Get all tasks for the authenticated user.
     */
    public function index(): Response
    {
        $tasks = $this->taskService->getUserTasks(auth()->id());

        return response($tasks, 200);
    }

    /**
     * Get a specific task by ID.
     */
    public function show(string $id): Response
    {
        $task = $this->taskService->getTaskForUser(auth()->id(), $id);

        if (!$task) {
            return response(['message' => 'Task not found'], 404);
        }

        return response($task, 200);
    }

    /**
     * Store a newly created task in storage.
     */
    public function store(StoreTaskRequest $request): Response
    {
        $task = $this->taskService->createTask(
            auth()->id(),
            $request->validated()
        );

        return response($task, 201);
    }

    /**
     * Update a task for the authenticated user.
     */
    public function update(UpdateTaskRequest $request, string $id): Response
    {
        $task = $this->taskService->updateTask(auth()->id(), $id, $request->validated());

        if (! $task) {
            return response(['message' => 'Task not found or not owned by user'], 404);
        }

        return response($task, 200);
    }

    /**
     * Delete a task for the authenticated user.
     */
    public function destroy(string $id): Response
    {
        $deleted = $this->taskService->deleteTask(auth()->id(), $id);

        if (! $deleted) {
            return response(['message' => 'Task not found or not owned by user'], 404);
        }

        return response(null, 204);
    }
}
