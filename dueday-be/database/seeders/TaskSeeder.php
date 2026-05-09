<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{

    /**
     * Seed the tasks table.
     */
    public function run(): void
    {
        // Get the user created by UserSeeder
        $user = User::where('username', 'bglorychen')->first();

        if (! $user) {
            return;
        }

        // Create tasks directly with the user's ID
        for ($i = 0; $i < 5; $i++) {
            Task::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'user_id' => $user->id,
                'id_tag' => fake()->randomElement([1, 2, 3, 4, null]),
                'task_name' => fake()->sentence(3),
                'date' => fake()->dateTimeBetween('now', '+30 days'),
                'time' => fake()->time(),
                'priority' => fake()->randomElement(['low', 'medium', 'high']),
                'status' => 'ongoing',
                'source' => fake()->randomElement(['manual', 'imported', 'api']),
                'deskripsi' => fake()->paragraph(),
                'progress' => fake()->numberBetween(0, 100),
                'ulangi' => fake()->randomElement(['setiap_hari', 'satu_minggu', 'satu_bulan', 'satu_tahun', null]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
