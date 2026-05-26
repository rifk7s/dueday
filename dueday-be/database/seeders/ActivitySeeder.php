<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ActivitySeeder extends Seeder
{
    /**
     * Seed the activities table.
     */
    public function run(): void
    {
        $user = User::where('username', 'bglorychen')->first();

        if (! $user) {
            return;
        }

        $activities = [
            [
                'name' => 'Lari pagi',
                'date' => now()->toDateString(),
                'time_start' => '06:00:00',
                'time_end' => '06:30:00',
                'status' => 'pending',
                'progress' => 40,
                'description' => 'Sesi lari santai untuk menjaga konsistensi olahraga.',
                'recurrence' => 'daily',
            ],
            [
                'name' => 'Belajar Laravel',
                'date' => now()->addDay()->toDateString(),
                'time_start' => '19:00:00',
                'time_end' => '21:00:00',
                'status' => 'not_started',
                'progress' => 0,
                'description' => 'Mempelajari model, seeder, dan relasi Eloquent.',
                'recurrence' => 'weekly',
            ],
            [
                'name' => 'Rapat tim',
                'date' => now()->addDays(2)->toDateString(),
                'time_start' => '10:00:00',
                'time_end' => '11:00:00',
                'status' => 'completed',
                'progress' => 100,
                'description' => 'Evaluasi progres kerja minggu ini.',
                'recurrence' => null,
            ],
        ];

        foreach ($activities as $activity) {
            // Set anchor_date to the same value as `date` if a repeat rule exists
            $anchorDate = (!empty($activity['recurrence'])) ? $activity['date'] : null;

            Activity::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'tag_id' => fake()->randomElement([1, 2, 3, 4, null]),
                'anchor_date' => $anchorDate,
                ...$activity,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}