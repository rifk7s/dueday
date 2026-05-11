<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
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
               "- [+] Item 1\n- [ ] Item 2",
               "- [+] Task A\n- [+] Task B\n- [ ] Task C",
               "- [ ] Incomplete task",
               "- [+] Done\n- [+] Also done",
           ];
       
           $goalsText = fake()->randomElement($goalTexts);
           $goalPoints = \App\Services\TaskGoalService::parseGoals($goalsText);
           $progress = \App\Services\TaskGoalService::calculateProgress($goalPoints);
       
           return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'id_tag' => null,
            'task_name' => fake()->sentence(3),
            'date' => fake()->date(),
            'time' => fake()->time(),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'status' => 'ongoing',
            'source' => fake()->randomElement(['manual', 'imported', 'api']),
            'deskripsi' => fake()->paragraph(),
               'goals' => $goalsText,
               'goal_points' => $goalPoints,
               'progress' => $progress,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
