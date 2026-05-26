<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use App\Services\TaskGoalService;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $goalTexts = [
            "Item 1\nItem 2",
            "Task A\nTask B\nTask C",
            'Incomplete task',
            "Done\nAlso done",
        ];

        $goalsText = fake()->randomElement($goalTexts);
        $goalPoints = TaskGoalService::parseGoals($goalsText);
        $progress = TaskGoalService::calculateProgress($goalPoints);

        return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'tag_id' => null,
            'name' => fake()->sentence(3),
            'due_date' => fake()->date(),
            'due_time' => fake()->time(),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'status' => $progress >= 100 ? 'completed' : 'ongoing',
            'source' => fake()->randomElement(['manual', 'elearn']),
            'description' => fake()->paragraph(),
            'goals' => $goalsText,
            'goal_points' => $goalPoints,
            'progress' => $progress,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
