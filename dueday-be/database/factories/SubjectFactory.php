<?php

namespace Database\Factories;

use App\Models\Major;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subject>
 */
class SubjectFactory extends Factory
{
    private const ACADEMIC_YEAR = 2025;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $semester = fake()->randomElement([1, 2]);

        return [
            'name' => fake()->words(2, true),
            'major_id' => Major::factory(),
            'semester' => $semester,
            'sks' => fake()->randomElement([2, 3]),
            'period' => (string) self::ACADEMIC_YEAR.'_'.$semester,
        ];
    }
}
