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
            // Generate sample goals with points
            $goalTexts = [
                "- [+] Isi dalam bentuk poin\n- [+] Contoh: Laporan RPL Bab 3\n- [ ] Poin lainnya",
                "- [+] Belajar database\n- [ ] Membuat query\n- [ ] Optimization",
                "- [+] Selesaikan task 1\n- [+] Review code\n- [ ] Deploy ke production",
                "- [ ] Planning\n- [ ] Development\n- [ ] Testing\n- [ ] Deployment",
                "- [+] Requirement gathering\n- [+] Design phase\n- [ ] Implementation"
            ];
            
            $goalsText = fake()->randomElement($goalTexts);
            
            // Parse goals to create goal_points structure
            $goalPoints = $this->parseGoals($goalsText);
            
            // Calculate progress based on completed points
            $completedCount = collect($goalPoints)->filter(fn($point) => $point['completed'])->count();
            $totalCount = count($goalPoints);
            $progress = $totalCount > 0 ? (int)(($completedCount / $totalCount) * 100) : 0;
            
            Task::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'user_id' => $user->id,
                'id_tag' => fake()->randomElement([1, 2, 3, 4, null]),
                'task_name' => fake()->sentence(3),
                'date' => fake()->date(),
                'time' => fake()->time(),
                'priority' => fake()->randomElement(['low', 'medium', 'high']),
                'status' => 'ongoing',
                'source' => fake()->randomElement(['manual', 'imported', 'api']),
                'deskripsi' => fake()->paragraph(),
                'goals' => $goalsText,
                'goal_points' => $goalPoints,
                'progress' => $progress,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
    
    /**
     * Parse goals text and extract points with completion status
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
            
            // Check if point is completed [+] or incomplete [ ]
            $completed = str_contains($line, '[+]');
            
            // Extract the point text (remove the checkbox part)
            $text = preg_replace('/^\s*-\s*\[[\+\s]\]\s*/', '', $line);
            
            if (!empty($text)) {
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
