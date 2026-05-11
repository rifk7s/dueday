<?php

namespace App\Repositories;

use App\Models\Task;
use Illuminate\Support\Str;

class TaskRepository
{
    /**
     * Create a new task.
     *
     * @param array $data
     * @return Task
     */
    public function create(array $data): Task
    {
        return Task::create([
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
            'progress' => $data['progress'] ?? 0,
            'ulangi' => $data['ulangi'] ?? null,
        ]);
    }

    /**
     * Find a task by ID.
     *
     * @param string $id
     * @return Task|null
     */
    public function findById(string $id): ?Task
    {
        return Task::find($id);
    }

    /**
     * Get all tasks for a user.
     *
     * @param string $userId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getByUserId(string $userId)
    {
        return Task::where('user_id', $userId)->get();
    }

    /**
     * Update a task by id.
     *
     * @param string $id
     * @param array $data
     * @return Task|null
     */
    public function update(string $id, array $data): ?Task
    {
        $task = $this->findById($id);

        if (! $task) {
            return null;
        }

        $task->fill($data);
        $task->save();

        return $task;
    }

    /**
     * Delete a task by id.
     *
     * @param string $id
     * @return bool
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
