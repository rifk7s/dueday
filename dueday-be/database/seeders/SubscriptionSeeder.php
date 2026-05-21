<?php

namespace Database\Seeders;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SubscriptionSeeder extends Seeder
{
    /**
     * Seed the subscriptions table.
     */
    public function run(): void
    {
        $user = User::where('username', 'bglorychen')->first();

        if (! $user) {
            return;
        }

        Subscription::create([
            'id' => Str::uuid(),
            'user_id' => $user->id,
            'plan' => 'satu_bulan',
            'status' => 'active',
            'started_at' => now()->subDays(10),
            'expired_at' => now()->addDays(20),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
