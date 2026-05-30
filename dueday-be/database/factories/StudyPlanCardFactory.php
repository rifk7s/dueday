<?php

namespace Database\Factories;

use App\Models\OpenedClass;
use App\Models\RegStudent;
use App\Models\StudyPlanCard;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudyPlanCard>
 */
class StudyPlanCardFactory extends Factory
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
            'period' => (string) self::ACADEMIC_YEAR.'_'.$semester,
            'reg_student_id' => RegStudent::factory(),
            'opened_class_id' => OpenedClass::factory(),
        ];
    }
}
