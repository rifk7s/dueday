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
            'progress' => fake()->numberBetween(0, 100),
            'ulangi' => fake()->randomElement(['setiap_hari', 'satu_minggu', 'satu_bulan', 'satu_tahun', null]),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
