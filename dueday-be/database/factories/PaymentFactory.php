<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'subscription_id' => Subscription::factory(),
            'amount' => fake()->randomFloat(2, 10000, 500000),
            'method' => fake()->randomElement(['bank_transfer', 'credit_card', 'gopay', 'ovo']),
            'status' => fake()->randomElement(['pending', 'paid', 'failed', 'refunded']),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
