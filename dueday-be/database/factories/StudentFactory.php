<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\Title;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
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
            'student_name' => fake()->name(),
            'title_id' => Title::factory(),
            'current_semester' => fake()->numberBetween(1, 4),
            'nim' => fake()->unique()->numerify('0806#########'),
            'password' => Hash::make('Password123'),
        ];
    }
}
