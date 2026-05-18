<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class NotificationSeeder extends Seeder
{
    /**
     * Seed the notifications table.
     */
    public function run(): void
    {
        $user = User::where('username', 'bglorychen')->first();

        if (! $user) {
            return;
        }

        $notifications = [
            [
                'type' => 'reminder',
                'reference_id' => null,
                'title' => 'Pengingat tugas',
                'message' => 'Tugas Laravel jatuh tempo hari ini.',
                'is_read' => false,
            ],
            [
                'type' => 'system',
                'reference_id' => null,
                'title' => 'Selamat datang di DueDay',
                'message' => 'Akun kamu berhasil dibuat.',
                'is_read' => true,
            ],
        ];

        foreach ($notifications as $notification) {
            Notification::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                ...$notification,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
