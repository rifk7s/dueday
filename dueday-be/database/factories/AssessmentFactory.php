<?php

namespace Database\Factories;

use App\Models\Assessment;
use App\Models\OpenedClass;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Assessment>
 */
class AssessmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'opened_class_id' => OpenedClass::factory(),
            'title' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'date' => fake()->date(),
            'time' => fake()->time(),
        ];
    }
}
