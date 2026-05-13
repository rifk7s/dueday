<?php

namespace App\Repositories;

use App\Models\Task;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class TaskRepository
{
    /**
     * Create a new task.
     */
    public function create(array $data): Task
    {
        $task = Task::create([
            'id' => $data['id'] ?? Str::uuid(),
            'user_id' => $data['user_id'],
            'id_tag' => $data['id_tag'] ?? null,
            'task_name' => $data['task_name'],
            'date' => $data['date'],
            'time' => $data['time'] ?? null,
            'priority' => $data['priority'] ?? null,
            'status' => $data['status'] ?? 'ongoing',
            'source' => $data['source'] ?? null,
            'deskripsi' => $data['deskripsi'] ?? null,
            'goals' => $data['goals'] ?? null,
            'goal_points' => $data['goal_points'] ?? null,
            'progress' => $data['progress'] ?? 0,
        ]);

        return $task->load('tag');
    }

    /**
     * Find a task by ID.
     */
    public function findById(string $id): ?Task
    {
        return Task::with('tag')->find($id);
    }

    /**
     * Get all tasks for a user.
     *
     * @return Collection
     */
    public function getByUserId(string $userId)
    {
        return Task::with('tag')->where('user_id', $userId)->get();
    }

    /**
     * Update a task by id.
     */
    public function update(string $id, array $data): ?Task
    {
        $task = $this->findById($id);

        if (! $task) {
            return null;
        }

        $task->fill($data);
        $task->save();

        return $task->load('tag');
    }

    /**
     * Delete a task by id.
     */
    public function delete(string $id): bool
    {
        $task = $this->findById($id);

        if (! $task) {
            return false;
        }

        return (bool) $task->delete();
    }
}
