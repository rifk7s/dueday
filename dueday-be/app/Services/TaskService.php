<?php

namespace App\Services;

use App\Repositories\TaskRepository;
use App\Models\Task;

class TaskService
{
    public function __construct(
        private TaskRepository $taskRepository
    ) {}

    /**
     * Create a new task for the authenticated user.
     *
     * @param string $userId
     * @param array $data
     * @return Task
     */
    public function createTask(string $userId, array $data): Task
    {
        $data['user_id'] = $userId;
        $data = $this->processGoals($data);
        
        return $this->taskRepository->create($data);
    }

    /**
     * Get all tasks for a user.
     *
     * @param string $userId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getUserTasks(string $userId)
    {
        return $this->taskRepository->getByUserId($userId);
    }

    /**
     * Get a task by ID (with ownership check).
     *
     * @param string $userId
     * @param string $taskId
     * @return Task|null
     */
    public function getTaskForUser(string $userId, string $taskId): ?Task
    {
        $task = $this->taskRepository->findById($taskId);
        
        if ($task && $task->user_id === $userId) {
            return $task;
        }
        
        return null;
    }

    /**
     * Update a task for a user (with ownership check).
     *
     * @param string $userId
     * @param string $taskId
     * @param array $data
     * @return Task|null
     */
    public function updateTask(string $userId, string $taskId, array $data): ?Task
    {
        $task = $this->taskRepository->findById($taskId);

        if (! $task || $task->user_id !== $userId) {
            return null;
        }

        // If the client sent the raw `goals` text but it is identical to the
        // stored text, don't re-parse it — parsing regenerates `goal_points`
        // and would reset any per-item completion status. Only parse when
        // the raw `goals` value actually changed or when `goal_points` are
        // explicitly provided.
        if (isset($data['goals']) && is_string($data['goals']) && $data['goals'] === $task->goals) {
            unset($data['goals']);
        }

        $data = $this->processGoals($data);

        return $this->taskRepository->update($taskId, $data);
    }

    /**
     * Delete a task for a user (with ownership check).
     *
     * @param string $userId
     * @param string $taskId
     * @return bool
     */
    public function deleteTask(string $userId, string $taskId): bool
    {
        $task = $this->taskRepository->findById($taskId);

        if (! $task || $task->user_id !== $userId) {
            return false;
        }

        return $this->taskRepository->delete($taskId);
    }

    /**
     * Process goals: parse goal text and calculate progress
     */
    private function processGoals(array $data): array
    {
        if (isset($data['goals']) && is_string($data['goals'])) {
            $goalPoints = TaskGoalService::parseGoals($data['goals']);
            $data['goal_points'] = $goalPoints;
            $data['progress'] = TaskGoalService::calculateProgress($goalPoints);
            $data['status'] = $data['progress'] >= 100 ? 'completed' : 'ongoing';
        } elseif (isset($data['goal_points']) && is_array($data['goal_points'])) {
            // If goal_points is being updated directly, recalculate progress
            // Do NOT regenerate the raw goals text here to avoid reintroducing
            // bracket markers (e.g., "- [+] ...") into the user's `goals` field.
            $data['progress'] = TaskGoalService::calculateProgress($data['goal_points']);
            $data['status'] = $data['progress'] >= 100 ? 'completed' : 'ongoing';
        }

        return $data;
    }
}

