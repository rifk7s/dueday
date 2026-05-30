<?php

use App\Models\Admin;
use App\Models\Assessment;
use App\Models\Detail;
use App\Models\OpenedClass;
use App\Models\RegStudent;
use App\Models\Student;
use App\Models\StudyPlanCard;
use App\Models\Subject;

it('elearn factories create related records', function () {
    $admin = Admin::factory()->create();
    $student = Student::factory()->create();
    $regStudent = RegStudent::factory()->create();
    $subject = Subject::factory()->create();
    $openedClass = OpenedClass::factory()->create();
    $studyPlanCard = StudyPlanCard::factory()->create();
    $assessment = Assessment::factory()->create();
    $detail = Detail::factory()->create();

    expect($admin->title)->not->toBeNull();
    expect($student->title)->not->toBeNull();
    expect($regStudent->student)->not->toBeNull();
    expect($regStudent->major)->not->toBeNull();
    expect($subject->major)->not->toBeNull();
    expect($openedClass->subject)->not->toBeNull();
    expect($studyPlanCard->regStudent)->not->toBeNull();
    expect($studyPlanCard->openedClass)->not->toBeNull();
    expect($assessment->openedClass)->not->toBeNull();
    expect($detail->assessment)->not->toBeNull();
    expect($detail->regStudent)->not->toBeNull();
});

it('elearn period factories use an academic year format', function () {
    $subject = Subject::factory()->create();
    $studyPlanCard = StudyPlanCard::factory()->create();

    expect($subject->period)->toMatch('/^2025_[12]$/');
    expect($studyPlanCard->period)->toMatch('/^2025_[12]$/');
});
