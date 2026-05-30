<?php

namespace Database\Factories;

use App\Models\OpenedClass;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OpenedClass>
 */
class OpenedClassFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subject_id' => Subject::factory(),
            'parallel' => fake()->randomElement(['A', 'B', 'C', 'D', 'E', 'F', 'G']),
            'student_num' => fake()->numberBetween(20, 40),
            'session' => 16,
        ];
    }
}
