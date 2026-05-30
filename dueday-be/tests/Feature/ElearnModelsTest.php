<?php

use App\Models\Admin;
use App\Models\Assessment;
use App\Models\Detail;
use App\Models\Major;
use App\Models\OpenedClass;
use App\Models\RegStudent;
use App\Models\Student;
use App\Models\StudyPlanCard;
use App\Models\Subject;
use App\Models\Title;
use Illuminate\Support\Facades\DB;

test('elearn models point to the expected tables and resolve core relations', function () {
    expect((new Admin)->getTable())->toBe('admin');
    expect((new Title)->getTable())->toBe('title');
    expect((new Student)->getTable())->toBe('students');
    expect((new Major)->getTable())->toBe('major');
    expect((new RegStudent)->getTable())->toBe('reg_student');
    expect((new Subject)->getTable())->toBe('subject');
    expect((new OpenedClass)->getTable())->toBe('opened_class');
    expect((new StudyPlanCard)->getTable())->toBe('study_plan_card');
    expect((new Assessment)->getTable())->toBe('assessment');
    expect((new Detail)->getTable())->toBe('detail');

    DB::table('title')->insert([
        ['id' => 1, 'name' => 'admin'],
        ['id' => 2, 'name' => 'student'],
    ]);

    DB::table('major')->insert([
        ['id' => 1, 'name' => 'MAN'],
    ]);

    $admin = Admin::query()->create([
        'name' => 'Administrator',
        'title_id' => 1,
        'password' => 'secret',
    ]);

    $student = Student::query()->create([
        'id' => '11111111-1111-1111-1111-111111111111',
        'student_name' => 'Student MAN',
        'title_id' => 2,
        'current_semester' => 1,
        'nim' => '0806010001',
    ]);

    $regStudent = RegStudent::query()->create([
        'student_id' => $student->id,
        'student_year' => 1,
        'major_id' => 1,
    ]);

    $subject = Subject::query()->create([
        'name' => 'Management Basics',
        'major_id' => 1,
        'semester' => 1,
        'sks' => 3,
        'period' => '1.1',
    ]);

    $openedClass = OpenedClass::query()->create([
        'subject_id' => $subject->id,
        'parallel' => 'A',
        'student_num' => 30,
        'session' => 16,
    ]);

    $studyPlanCard = StudyPlanCard::query()->create([
        'period' => '1.1',
        'reg_student_id' => $regStudent->id,
        'opened_class_id' => $openedClass->id,
    ]);

    $assessment = Assessment::query()->create([
        'opened_class_id' => $openedClass->id,
        'title' => 'Management Basics Assignment',
        'description' => 'Assignment for Student MAN in Management Basics',
        'date' => now()->toDateString(),
        'time' => '09:00:00',
    ]);

    $detail = Detail::query()->create([
        'assessment_id' => $assessment->id,
        'reg_student_id' => $regStudent->id,
        'file_name' => 'pdf',
        'nilai' => 91,
    ]);

    expect($admin->title->name)->toBe('admin');
    expect($student->title->name)->toBe('student');
    expect($student->regStudent->major->name)->toBe('MAN');
    expect($subject->major->name)->toBe('MAN');
    expect($openedClass->subject->name)->toBe('Management Basics');
    expect($studyPlanCard->openedClass->id)->toBe($openedClass->id);
    expect($assessment->details->first()->id)->toBe($detail->id);
});
