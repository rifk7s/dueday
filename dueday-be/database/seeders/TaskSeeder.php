<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TaskSeeder extends Seeder
{
    /**
     * Seed the tasks table.
     */
    public function run(): void
    {
        $user = User::where('username', 'bglorychen')->first();

        if (! $user) {
            return;
        }

        $tasks = [
            [
                'name' => 'Wireframe MAD',
                'due_date' => '2026-04-30',
                'due_time' => '18:00:00',
                'priority' => 'high',
                'status' => 'ongoing',
                'description' => 'Final review untuk project Dueday App',
                'goals' => "Susun struktur halaman\nBuat wireframe utama\nReview dengan dosen\nRevisi akhir",
                'tag_id' => 1,
            ],
            [
                'name' => 'Sistem Login & Session Sederhana',
                'due_date' => '2026-01-30',
                'due_time' => '17:00:00',
                'priority' => 'medium',
                'status' => 'ongoing',
                'description' => 'Buat fitur login',
                'goals' => "Setup form login\nImplementasi token\nHandle error state\nTes flow login",
                'tag_id' => 1,
            ],
            [
                'name' => 'Rangkuman Sistem Informasi',
                'due_date' => '2026-02-05',
                'due_time' => '15:00:00',
                'priority' => 'low',
                'status' => 'ongoing',
                'description' => 'Rangkum bab 3 dan 4',
                'goals' => "Baca bab 3\nCatat poin penting bab 3\nBaca bab 4\nCatat poin penting bab 4",
                'tag_id' => 1,
            ],
            [
                'name' => 'Laporan hasil riset',
                'due_date' => '2025-12-31',
                'due_time' => '13:30:00',
                'priority' => 'medium',
                'status' => 'completed',
                'description' => 'Laporan hasil riset kompetitor',
                'goals' => "Kumpulkan data kompetitor\nAnalisis fitur\nSusun laporan akhir",
                'tag_id' => 2,
            ],
        ];

        foreach ($tasks as $task) {
            $goalPoints = $this->parseGoals($task['goals']);
            $completedCount = collect($goalPoints)->filter(fn ($point) => $point['completed'])->count();
            $totalCount = count($goalPoints);
            $progress = $totalCount > 0 ? (int) (($completedCount / $totalCount) * 100) : 0;

                Task::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'tag_id' => $task['tag_id'],
                'name' => $task['name'],
                'due_date' => $task['due_date'],
                'due_time' => $task['due_time'],
                'priority' => $task['priority'],
                'status' => $task['status'],
                'source' => 'manual',
                'description' => $task['description'],
                'goals' => $task['goals'],
                'goal_points' => $goalPoints,
                'progress' => $progress,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Parse goals text and extract points with completion status.
     */
    private function parseGoals(string $goalsText): array
    {
        $goalPoints = [];
        $lines = explode("\n", trim($goalsText));
        $pointId = 1;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            $completed = str_contains($line, '[+]');
            $text = preg_replace('/^\s*-\s*\[[\+\s]\]\s*/', '', $line);

            if (! empty($text)) {
                $goalPoints[] = [
                    'id' => $pointId,
                    'text' => $text,
                    'completed' => $completed,
                ];
                $pointId++;
            }
        }

        return $goalPoints;
    }
}
