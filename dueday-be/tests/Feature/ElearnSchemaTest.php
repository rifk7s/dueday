<?php

use Illuminate\Support\Facades\Schema;

it('creates the elearn simulation tables', function () {
    $tables = [
        'title',
        'admin',
        'students',
        'major',
        'reg_student',
        'subject',
        'opened_class',
        'study_plan_card',
        'assessment',
        'detail',
    ];

    foreach ($tables as $table) {
        expect(Schema::hasTable($table))->toBeTrue();
    }

    expect(Schema::hasColumns('students', ['id', 'student_name', 'title_id', 'current_semester', 'nim']))
        ->toBeTrue();
    expect(Schema::hasColumns('opened_class', ['id', 'subject_id', 'parallel', 'student_num', 'session']))
        ->toBeTrue();
    expect(Schema::hasColumns('detail', ['id', 'assessment_id', 'reg_student_id', 'file_name', 'nilai', 'submission_text', 'submission_file_path', 'submitted_at']))
        ->toBeTrue();
});
