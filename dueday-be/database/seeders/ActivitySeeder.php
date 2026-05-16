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
                'activity_name' => 'Lari pagi',
                'tanggal' => now()->toDateString(),
                'time_start' => '06:00:00',
                'time_end' => '06:30:00',
                'status' => 'not_started',
                'progress' => 40,
                'deskripsi' => 'Sesi lari santai untuk menjaga konsistensi olahraga.',
                'ulangi' => 'setiap_hari',
            ],
            [
                'activity_name' => 'Belajar Laravel',
                'tanggal' => now()->addDay()->toDateString(),
                'time_start' => '19:00:00',
                'time_end' => '21:00:00',
                'status' => 'pending',
                'progress' => 0,
                'deskripsi' => 'Mempelajari model, seeder, dan relasi Eloquent.',
                'ulangi' => 'satu_minggu',
            ],
            [
                'activity_name' => 'Rapat tim',
                'tanggal' => now()->addDays(2)->toDateString(),
                'time_start' => '10:00:00',
                'time_end' => '11:00:00',
                'status' => 'completed',
                'progress' => 100,
                'deskripsi' => 'Evaluasi progres kerja minggu ini.',
                'ulangi' => null,
            ],
        ];

        foreach ($activities as $activity) {
            Activity::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'id_tag' => fake()->randomElement([1, 2, 3, 4, null]),
                ...$activity,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
