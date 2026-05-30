<?php

namespace Database\Factories;

use App\Models\Assessment;
use App\Models\Detail;
use App\Models\RegStudent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Detail>
 */
class DetailFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'assessment_id' => Assessment::factory(),
            'reg_student_id' => RegStudent::factory(),
            'file_name' => fake()->randomElement(['pdf', 'txt']),
            'nilai' => fake()->randomFloat(2, 0, 100),
        ];
    }
}
