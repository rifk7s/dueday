<?php

namespace Database\Seeders;

use App\Models\Reminder;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ReminderSeeder extends Seeder
{
    /**
     * Seed the reminders table.
     */
    public function run(): void
    {
        $user = User::where('username', 'bglorychen')->first();

        if (! $user) {
            return;
        }

        $reminders = [
            [
                'isi_reminder' => 'Jangan lupa lari pagi!',
                'jenis' => 'activity',
                'waktu' => '05:45:00',
                'suara_notifikasi' => 'chime',
                'gaya_pesan' => 'santai',
                'frekuensi' => 1,
                'getaran' => true,
            ],
            [
                'isi_reminder' => 'Kerjakan tugas Laravel sekarang.',
                'jenis' => 'task',
                'waktu' => '18:30:00',
                'suara_notifikasi' => 'bell',
                'gaya_pesan' => 'tegas',
                'frekuensi' => 2,
                'getaran' => false,
            ],
        ];

        foreach ($reminders as $reminder) {
            Reminder::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                ...$reminder,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
