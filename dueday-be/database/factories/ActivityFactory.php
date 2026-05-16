<?php

namespace Database\Factories;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Activity>
 */
class ActivityFactory extends Factory
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
            'activity_name' => fake()->sentence(3),
            'tanggal' => fake()->date(),
            'time_start' => fake()->time(),
            'time_end' => fake()->time(),
            'status' => fake()->randomElement(['not_started', 'ongoing', 'pending', 'completed']),
            'progress' => fake()->numberBetween(0, 100),
            'deskripsi' => fake()->paragraph(),
            'ulangi' => fake()->randomElement(['setiap_hari', 'satu_minggu', 'satu_bulan', 'satu_tahun', null]),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
