<?php

namespace Database\Factories;

use App\Models\Reminder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Reminder>
 */
class ReminderFactory extends Factory
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
            'isi_reminder' => fake()->sentence(4),
            'jenis' => fake()->randomElement(['task', 'activity']),
            'waktu' => fake()->time(),
            'suara_notifikasi' => fake()->randomElement(['default', 'chime', 'bell']),
            'gaya_pesan' => fake()->randomElement(['motivasi', 'tegas', 'humor']),
            'frekuensi' => fake()->numberBetween(1, 5),
            'getaran' => fake()->boolean(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
