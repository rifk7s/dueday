<?php

namespace Database\Factories;

use App\Models\Major;
use App\Models\RegStudent;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RegStudent>
 */
class RegStudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'student_year' => fake()->numberBetween(1, 4),
            'major_id' => Major::factory(),
        ];
    }
}
