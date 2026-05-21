<?php

namespace Database\Factories;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startedAt = fake()->dateTimeBetween('-3 months', 'now');

        return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'plan' => fake()->randomElement(['satu_bulan', 'tiga_bulan', 'satu_tahun']),
            'status' => fake()->randomElement(['active', 'expired', 'cancelled', 'pending']),
            'started_at' => $startedAt,
            'expired_at' => (clone $startedAt)->modify('+1 month'),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
