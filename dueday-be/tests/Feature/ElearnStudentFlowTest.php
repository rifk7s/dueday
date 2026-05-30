<?php

use App\Models\User;
use App\Models\Task;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

it('shows student assignments and accepts txt or pdf submissions based on the assignment file name', function () {
    Storage::fake('public');

    DB::table('title')->insert([
        ['id' => 1, 'name' => 'admin'],
        ['id' => 2, 'name' => 'student'],
    ]);

    DB::table('major')->insert([
        ['id' => 1, 'name' => 'MAN'],
    ]);

    $studentUser = User::query()->create([
        'id' => 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'name' => 'Student One User',
        'username' => 'student_one',
        'email' => 'student1@test.local',
        'nim' => '0806010001',
        'password' => 'Password123',
        'role' => 'student',
    ]);

    $studentId = '11111111-1111-1111-1111-111111111111';

    DB::table('students')->insert([
        'id' => $studentId,
        'student_name' => 'Student One',
        'title_id' => 2,
        'current_semester' => 1,
        'nim' => '0806010001',
        'password' => bcrypt('Password123'),
    ]);

    DB::table('reg_student')->insert([
        'id' => 1,
        'student_id' => $studentId,
        'student_year' => 1,
        'major_id' => 1,
    ]);

    DB::table('subject')->insert([
        'id' => 1,
        'name' => 'Management Basics',
        'major_id' => 1,
        'semester' => 1,
        'sks' => 3,
        'period' => '2025_1',
    ]);

    DB::table('opened_class')->insert([
        'id' => 1,
        'subject_id' => 1,
        'parallel' => 'A',
        'student_num' => 30,
        'session' => 16,
    ]);

    DB::table('study_plan_card')->insert([
        'id' => 1,
        'period' => '2025_1',
        'reg_student_id' => 1,
        'opened_class_id' => 1,
    ]);

    DB::table('assessment')->insert([
        [
            'id' => 1,
            'opened_class_id' => 1,
            'title' => 'Text Assignment',
            'description' => 'Type your answer',
            'date' => now()->toDateString(),
            'time' => '09:00:00',
            'file_name' => 'txt',
        ],
        [
            'id' => 2,
            'opened_class_id' => 1,
            'title' => 'PDF Assignment',
            'description' => 'Upload your file',
            'date' => now()->toDateString(),
            'time' => '10:00:00',
            'file_name' => 'pdf',
        ],
    ]);

    DB::table('detail')->insert([
        [
            'id' => 1,
            'assessment_id' => 1,
            'reg_student_id' => 1,
            'file_name' => 'txt',
            'nilai' => null,
        ],
        [
            'id' => 2,
            'assessment_id' => 2,
            'reg_student_id' => 1,
            'file_name' => 'pdf',
            'nilai' => null,
        ],
    ]);

    Task::query()->insert([
        [
            'id' => 'dddddddd-dddd-dddd-dddd-dddddddddddd',
            'user_id' => $studentUser->id,
            'tag_id' => null,
            'name' => 'Text Assignment',
            'due_date' => now()->toDateString(),
            'due_time' => '09:00:00',
            'priority' => null,
            'status' => 'ongoing',
            'source' => 'elearn',
            'description' => 'Type your answer',
            'progress' => 0,
            'goals' => null,
            'goal_points' => null,
        ],
        [
            'id' => 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
            'user_id' => $studentUser->id,
            'tag_id' => null,
            'name' => 'PDF Assignment',
            'due_date' => now()->toDateString(),
            'due_time' => '10:00:00',
            'priority' => null,
            'status' => 'ongoing',
            'source' => 'elearn',
            'description' => 'Upload your file',
            'progress' => 0,
            'goals' => null,
            'goal_points' => null,
        ],
    ]);

    $this->actingAs($studentUser)
        ->get(route('elearn.index'))
        ->assertOk()
        ->assertSee('Text Assignment')
        ->assertSee('PDF Assignment')
        ->assertSee('Type your answer')
        ->assertSee('Upload PDF');

    $this->actingAs($studentUser)
        ->post(route('elearn.details.submit', ['detail' => 1]), [
            'submission_text' => 'My typed answer',
        ])
        ->assertRedirect(route('elearn.index'));

    $this->actingAs($studentUser)
        ->get(route('elearn.index'))
        ->assertOk()
        ->assertSee('Resubmit Submission');

    expect(DB::table('detail')->where('id', 1)->value('submission_text'))->toBe('My typed answer');
    expect(DB::table('detail')->where('id', 1)->value('submission_file_path'))->toBeNull();
    expect(DB::table('detail')->where('id', 1)->value('submitted_at'))->not->toBeNull();
    expect(DB::table('tasks')->where('name', 'Text Assignment')->value('progress'))->toBe(100);
    expect(DB::table('tasks')->where('name', 'Text Assignment')->value('status'))->toBe('completed');

    $this->actingAs($studentUser)
        ->post(route('elearn.details.submit', ['detail' => 1]), [
            'submission_text' => 'My updated typed answer',
        ])
        ->assertRedirect(route('elearn.index'));

    expect(DB::table('detail')->where('id', 1)->value('submission_text'))->toBe('My updated typed answer');

    $pdf = UploadedFile::fake()->create('assignment.pdf', 100, 'application/pdf');
    $pdf2 = UploadedFile::fake()->create('assignment-v2.pdf', 100, 'application/pdf');

    $this->actingAs($studentUser)
        ->post(route('elearn.details.submit', ['detail' => 2]), [
            'submission_file' => $pdf,
        ])
        ->assertRedirect(route('elearn.index'));

    $storedPath = DB::table('detail')->where('id', 2)->value('submission_file_path');

    expect($storedPath)->not->toBeNull();
    expect(DB::table('detail')->where('id', 2)->value('submission_text'))->toBeNull();
    expect(DB::table('detail')->where('id', 2)->value('submitted_at'))->not->toBeNull();
    expect(DB::table('tasks')->where('name', 'PDF Assignment')->value('progress'))->toBe(100);
    expect(DB::table('tasks')->where('name', 'PDF Assignment')->value('status'))->toBe('completed');
    Storage::disk('public')->assertExists($storedPath);

    $this->actingAs($studentUser)
        ->post(route('elearn.details.submit', ['detail' => 2]), [
            'submission_file' => $pdf2,
        ])
        ->assertRedirect(route('elearn.index'));

    $newStoredPath = DB::table('detail')->where('id', 2)->value('submission_file_path');

    expect($newStoredPath)->not->toBe($storedPath);
    Storage::disk('public')->assertMissing($storedPath);
    Storage::disk('public')->assertExists($newStoredPath);
});
