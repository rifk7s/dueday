<?php

use Database\Seeders\ElearnSeeder;
use Illuminate\Support\Facades\DB;

it('seeds the elearn simulation data with matching relationships', function () {
    $this->seed(ElearnSeeder::class);

    expect(DB::table('title')->pluck('name')->all())->toBe(['admin', 'student']);
    expect(DB::table('major')->pluck('name')->all())->toBe(['MAN', 'IMT', 'VCD']);

    expect(DB::table('admin')->count())->toBe(1);
    expect(DB::table('students')->count())->toBe(3);
    expect(DB::table('reg_student')->count())->toBe(3);
    expect(DB::table('subject')->count())->toBe(9);
    expect(DB::table('opened_class')->count())->toBe(11);
    expect(DB::table('study_plan_card')->count())->toBe(9);
    expect(DB::table('assessment')->count())->toBe(9);
    expect(DB::table('detail')->count())->toBe(9);

    expect(DB::table('reg_student')->pluck('major_id')->sort()->values()->all())->toBe([1, 2, 3]);
    expect(DB::table('opened_class')->pluck('parallel')->all())->toBe(['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'B', 'B']);
    expect(DB::table('opened_class')->pluck('session')->unique()->values()->all())->toBe([16]);
    expect(DB::table('subject')->pluck('period')->all())->toBe(['2025_1', '2025_2', '2025_3', '2025_1', '2025_2', '2025_3', '2025_1', '2025_2', '2025_3']);
    expect(DB::table('study_plan_card')->pluck('period')->all())->toBe(['2025_1', '2025_2', '2025_3', '2025_1', '2025_2', '2025_3', '2025_1', '2025_2', '2025_3']);
    expect(DB::table('detail')->pluck('file_name')->all())->toBe(['txt', 'pdf', 'txt', 'pdf', 'txt', 'pdf', 'txt', 'pdf', 'txt']);

    $matchingPlanCards = DB::table('study_plan_card')
        ->join('reg_student', 'study_plan_card.reg_student_id', '=', 'reg_student.id')
        ->join('opened_class', 'study_plan_card.opened_class_id', '=', 'opened_class.id')
        ->join('subject', 'opened_class.subject_id', '=', 'subject.id')
        ->whereColumn('reg_student.major_id', 'subject.major_id')
        ->count();

    expect($matchingPlanCards)->toBe(9);
});
