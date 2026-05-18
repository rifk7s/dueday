<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
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
            'type' => fake()->randomElement(['reminder', 'system', 'payment', 'info']),
            'reference_id' => fake()->boolean() ? (string) Str::uuid() : null,
            'title' => fake()->sentence(3),
            'message' => fake()->paragraph(),
            'is_read' => fake()->boolean(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
