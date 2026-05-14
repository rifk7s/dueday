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
                'task_name' => 'Wireframe MAD',
                'date' => '2026-04-30',
                'time' => '18:00:00',
                'priority' => 'high',
                'status' => 'ongoing',
                'deskripsi' => 'Final review untuk project Dueday App',
                'goals' => "- [+] Susun struktur halaman\n- [+] Buat wireframe utama\n- [ ] Review dengan dosen\n- [ ] Revisi akhir",
                'id_tag' => 1,
            ],
            [
                'task_name' => 'Sistem Login & Session Sederhana',
                'date' => '2026-01-30',
                'time' => '17:00:00',
                'priority' => 'medium',
                'status' => 'ongoing',
                'deskripsi' => 'Buat fitur login',
                'goals' => "- [+] Setup form login\n- [+] Implementasi token\n- [ ] Handle error state\n- [ ] Tes flow login",
                'id_tag' => 1,
            ],
            [
                'task_name' => 'Rangkuman Sistem Informasi',
                'date' => '2026-02-05',
                'time' => '15:00:00',
                'priority' => 'low',
                'status' => 'ongoing',
                'deskripsi' => 'Rangkum bab 3 dan 4',
                'goals' => "- [+] Baca bab 3\n- [+] Catat poin penting bab 3\n- [ ] Baca bab 4\n- [ ] Catat poin penting bab 4",
                'id_tag' => 1,
            ],
            [
                'task_name' => 'Laporan hasil riset',
                'date' => '2025-12-31',
                'time' => '13:30:00',
                'priority' => 'medium',
                'status' => 'completed',
                'deskripsi' => 'Laporan hasil riset kompetitor',
                'goals' => "- [+] Kumpulkan data kompetitor\n- [+] Analisis fitur\n- [+] Susun laporan akhir",
                'id_tag' => 2,
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
                'id_tag' => $task['id_tag'],
                'task_name' => $task['task_name'],
                'date' => $task['date'],
                'time' => $task['time'],
                'priority' => $task['priority'],
                'status' => $task['status'],
                'source' => 'manual',
                'deskripsi' => $task['deskripsi'],
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
