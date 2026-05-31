<?php

use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;

it('only completes the submitting user\'s task and never another user\'s identically named task', function () {
    DB::table('title')->insert([
        ['id' => 1, 'name' => 'admin'],
        ['id' => 2, 'name' => 'student'],
    ]);

    DB::table('major')->insert([
        ['id' => 1, 'name' => 'MAN'],
    ]);

    $userA = User::query()->create([
        'id' => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'name' => 'User A',
        'username' => 'user_a',
        'email' => 'user_a@test.local',
        'nim' => '0806010001',
        'password' => 'Password123',
    ]);

    $userB = User::query()->create([
        'id' => 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'name' => 'User B',
        'username' => 'user_b',
        'email' => 'user_b@test.local',
        'nim' => '0806010002',
        'password' => 'Password123',
    ]);

    $studentId = '11111111-1111-1111-1111-111111111111';

    DB::table('students')->insert([
        'id' => $studentId,
        'student_name' => 'User A',
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
        'id' => 1,
        'opened_class_id' => 1,
        'title' => 'Shared Quiz',
        'description' => 'Answer the quiz',
        'date' => now()->toDateString(),
        'time' => '09:00:00',
        'file_name' => 'txt',
    ]);

    DB::table('detail')->insert([
        'id' => 1,
        'assessment_id' => 1,
        'reg_student_id' => 1,
        'file_name' => 'txt',
        'nilai' => null,
    ]);

    // Both users own a task with the SAME name. Only user A is the submitter.
    Task::query()->insert([
        [
            'id' => 'dddddddd-dddd-dddd-dddd-dddddddddddd',
            'user_id' => $userA->id,
            'tag_id' => null,
            'name' => 'Shared Quiz',
            'due_date' => now()->toDateString(),
            'due_time' => '09:00:00',
            'priority' => 'medium',
            'status' => 'ongoing',
            'source' => 'elearn',
            'description' => 'Answer the quiz',
            'progress' => 0,
            'goals' => null,
            'goal_points' => null,
            'elearn_assessment_id' => 1,
        ],
        [
            'id' => 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
            'user_id' => $userB->id,
            'tag_id' => null,
            'name' => 'Shared Quiz',
            'due_date' => now()->toDateString(),
            'due_time' => '09:00:00',
            'priority' => 'medium',
            'status' => 'ongoing',
            'source' => 'elearn',
            'description' => 'Answer the quiz',
            'progress' => 0,
            'goals' => null,
            'goal_points' => null,
            'elearn_assessment_id' => null,
        ],
    ]);

    $this->actingAs($userA)
        ->post(route('elearn.details.submit', ['detail' => 1]), [
            'submission_text' => 'My answer',
        ])
        ->assertRedirect(route('elearn.index'));

    // Submitter's task is completed.
    expect(Task::where('user_id', $userA->id)->value('status'))->toBe('completed');
    expect(Task::where('user_id', $userA->id)->value('progress'))->toBe(100);

    // The other user's identically named task is untouched (proves C1 is fixed).
    expect(Task::where('user_id', $userB->id)->value('status'))->toBe('ongoing');
    expect(Task::where('user_id', $userB->id)->value('progress'))->toBe(0);
});

it('completes a task tied to the same nim even when the authenticated user row differs', function () {
    DB::table('title')->insert([
        ['id' => 1, 'name' => 'admin'],
        ['id' => 2, 'name' => 'student'],
    ]);

    DB::table('major')->insert([
        ['id' => 1, 'name' => 'MAN'],
    ]);

    $seededUser = User::query()->create([
        'id' => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'name' => 'Student Seeded',
        'username' => 'student_seeded',
        'email' => 'seeded@test.local',
        'nim' => '0806010099',
        'password' => 'Password123',
    ]);

    $authUser = User::query()->create([
        'id' => 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'name' => 'Student Login',
        'username' => 'student_login',
        'email' => 'login@test.local',
        'nim' => '0806010099',
        'password' => 'Password123',
    ]);

    $studentId = '11111111-1111-1111-1111-111111111111';

    DB::table('students')->insert([
        'id' => $studentId,
        'student_name' => 'Student Seeded',
        'title_id' => 2,
        'current_semester' => 1,
        'nim' => '0806010099',
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
        'id' => 1,
        'opened_class_id' => 1,
        'title' => 'NIM Matched Assignment',
        'description' => 'Complete this assignment',
        'date' => now()->toDateString(),
        'time' => '09:00:00',
        'file_name' => 'txt',
    ]);

    DB::table('detail')->insert([
        'id' => 1,
        'assessment_id' => 1,
        'reg_student_id' => 1,
        'file_name' => 'txt',
        'nilai' => null,
    ]);

    Task::query()->insert([
        'id' => 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'user_id' => $seededUser->id,
        'tag_id' => null,
        'name' => 'NIM Matched Assignment',
        'due_date' => now()->toDateString(),
        'due_time' => '09:00:00',
        'priority' => 'medium',
        'status' => 'ongoing',
        'source' => 'elearn',
        'description' => 'Complete this assignment',
        'progress' => 0,
        'goals' => null,
        'goal_points' => null,
        'elearn_assessment_id' => 1,
    ]);

    $this->actingAs($authUser)
        ->post(route('elearn.details.submit', ['detail' => 1]), [
            'submission_text' => 'My answer',
        ])
        ->assertRedirect(route('elearn.index'));

    expect(Task::where('user_id', $seededUser->id)->value('status'))->toBe('completed');
    expect(Task::where('user_id', $seededUser->id)->value('progress'))->toBe(100);
});

it('does not complete a sibling task tagged to a different assessment that shares name, description, and due date', function () {
    DB::table('title')->insert([
        ['id' => 1, 'name' => 'admin'],
        ['id' => 2, 'name' => 'student'],
    ]);

    DB::table('major')->insert([
        ['id' => 1, 'name' => 'MAN'],
    ]);

    $user = User::query()->create([
        'id' => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'name' => 'Solo Student',
        'username' => 'solo_student',
        'email' => 'solo@test.local',
        'nim' => '0806010055',
        'password' => 'Password123',
    ]);

    $studentId = '11111111-1111-1111-1111-111111111111';

    DB::table('students')->insert([
        'id' => $studentId,
        'student_name' => 'Solo Student',
        'title_id' => 2,
        'current_semester' => 1,
        'nim' => '0806010055',
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

    // Two assessments with identical title/description/date — only their ids differ.
    DB::table('assessment')->insert([
        [
            'id' => 1,
            'opened_class_id' => 1,
            'title' => 'Duplicate Quiz',
            'description' => 'Answer the quiz',
            'date' => now()->toDateString(),
            'time' => '09:00:00',
            'file_name' => 'txt',
        ],
        [
            'id' => 2,
            'opened_class_id' => 1,
            'title' => 'Duplicate Quiz',
            'description' => 'Answer the quiz',
            'date' => now()->toDateString(),
            'time' => '09:00:00',
            'file_name' => 'txt',
        ],
    ]);

    DB::table('detail')->insert([
        'id' => 1,
        'assessment_id' => 1,
        'reg_student_id' => 1,
        'file_name' => 'txt',
        'nilai' => null,
    ]);

    // The submitter owns one task per assessment. They share name/description/due_date
    // but carry distinct elearn_assessment_id values.
    Task::query()->insert([
        [
            'id' => 'dddddddd-dddd-dddd-dddd-dddddddddddd',
            'user_id' => $user->id,
            'tag_id' => null,
            'name' => 'Duplicate Quiz',
            'due_date' => now()->toDateString(),
            'due_time' => '09:00:00',
            'priority' => 'medium',
            'status' => 'ongoing',
            'source' => 'elearn',
            'description' => 'Answer the quiz',
            'progress' => 0,
            'goals' => null,
            'goal_points' => null,
            'elearn_assessment_id' => 1,
        ],
        [
            'id' => 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
            'user_id' => $user->id,
            'tag_id' => null,
            'name' => 'Duplicate Quiz',
            'due_date' => now()->toDateString(),
            'due_time' => '09:00:00',
            'priority' => 'medium',
            'status' => 'ongoing',
            'source' => 'elearn',
            'description' => 'Answer the quiz',
            'progress' => 0,
            'goals' => null,
            'goal_points' => null,
            'elearn_assessment_id' => 2,
        ],
    ]);

    $this->actingAs($user)
        ->post(route('elearn.details.submit', ['detail' => 1]), [
            'submission_text' => 'My answer',
        ])
        ->assertRedirect(route('elearn.index'));

    // Only the task tagged to assessment 1 is completed.
    $completed = Task::where('elearn_assessment_id', 1)->first();
    expect($completed->status)->toBe('completed');
    expect($completed->progress)->toBe(100);

    // The sibling task tagged to assessment 2 is untouched despite identical fields.
    $sibling = Task::where('elearn_assessment_id', 2)->first();
    expect($sibling->status)->toBe('ongoing');
    expect($sibling->progress)->toBe(0);
});

it('completes a legacy task with no assessment id when the assessment has no date', function () {
    DB::table('title')->insert([
        ['id' => 1, 'name' => 'admin'],
        ['id' => 2, 'name' => 'student'],
    ]);

    DB::table('major')->insert([
        ['id' => 1, 'name' => 'MAN'],
    ]);

    $user = User::query()->create([
        'id' => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'name' => 'Legacy Student',
        'username' => 'legacy_student',
        'email' => 'legacy@test.local',
        'nim' => '0806010077',
        'password' => 'Password123',
    ]);

    $studentId = '11111111-1111-1111-1111-111111111111';

    DB::table('students')->insert([
        'id' => $studentId,
        'student_name' => 'Legacy Student',
        'title_id' => 2,
        'current_semester' => 1,
        'nim' => '0806010077',
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

    // Assessment with no date and no description (both nullable in the admin store).
    DB::table('assessment')->insert([
        'id' => 1,
        'opened_class_id' => 1,
        'title' => 'Undated Assignment',
        'description' => null,
        'date' => null,
        'time' => null,
        'file_name' => 'txt',
    ]);

    DB::table('detail')->insert([
        'id' => 1,
        'assessment_id' => 1,
        'reg_student_id' => 1,
        'file_name' => 'txt',
        'nilai' => null,
    ]);

    // Legacy task: created before the elearn_assessment_id column, so it must be
    // matched by name with a null description and a null due date.
    Task::query()->insert([
        'id' => 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'user_id' => $user->id,
        'tag_id' => null,
        'name' => 'Undated Assignment',
        'due_date' => null,
        'due_time' => null,
        'priority' => 'medium',
        'status' => 'ongoing',
        'source' => 'elearn',
        'description' => null,
        'progress' => 0,
        'goals' => null,
        'goal_points' => null,
        'elearn_assessment_id' => null,
    ]);

    $this->actingAs($user)
        ->post(route('elearn.details.submit', ['detail' => 1]), [
            'submission_text' => 'My answer',
        ])
        ->assertRedirect(route('elearn.index'));

    expect(Task::where('user_id', $user->id)->value('status'))->toBe('completed');
    expect(Task::where('user_id', $user->id)->value('progress'))->toBe(100);
});
