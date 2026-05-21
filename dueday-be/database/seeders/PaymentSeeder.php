<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PaymentSeeder extends Seeder
{
    /**
     * Seed the payments table.
     */
    public function run(): void
    {
        $user = User::where('username', 'bglorychen')->first();

        if (! $user) {
            return;
        }

        $subscription = Subscription::where('user_id', $user->id)->first();

        if (! $subscription) {
            return;
        }

        Payment::create([
            'id' => Str::uuid(),
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
            'amount' => 49000,
            'method' => 'bca',
            'status' => 'paid',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
