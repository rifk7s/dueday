<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

it('deletes the matching elearn task rows when an assignment is deleted', function () {
    DB::table('title')->insert([
        ['id' => 1, 'name' => 'admin'],
        ['id' => 2, 'name' => 'student'],
    ]);

    DB::table('major')->insert([
        ['id' => 1, 'name' => 'MAN'],
    ]);

    $admin = User::query()->create([
        'id' => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'name' => 'Admin Tester',
        'username' => 'admin_tester',
        'email' => 'admin@test.local',
        'password' => 'Password123',
    ]);

    // Grant admin via the guarded `is_admin` column (not mass-assignable).
    $admin->forceFill(['is_admin' => true])->save();

    DB::table('admin')->insert([
        'id' => 1,
        'name' => $admin->name,
        'password' => bcrypt('Password123'),
    ]);

    $studentUser = User::query()->create([
        'id' => 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'name' => 'Student One User',
        'username' => 'student_one',
        'email' => 'student1@test.local',
        'nim' => '0806010001',
        'password' => 'Password123',
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
        'id' => 1,
        'opened_class_id' => 1,
        'title' => 'Management Basics Assignment',
        'description' => 'Assignment for Student One',
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

    DB::table('tasks')->insert([
        'id' => 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'user_id' => $studentUser->id,
        'tag_id' => null,
        'name' => 'Management Basics Assignment',
        'due_date' => now()->toDateString(),
        'due_time' => '09:00:00',
        'priority' => null,
        'status' => 'ongoing',
        'source' => 'elearn',
        'description' => 'Assignment for Student One',
        'progress' => 0,
        'goals' => null,
        'goal_points' => null,
        'elearn_assessment_id' => 1,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.elearn.assignments.destroy', ['major' => 1, 'assessment' => 1]))
        ->assertRedirect(route('admin.elearn.assignments', ['major' => 1]));

    expect(DB::table('assessment')->count())->toBe(0);
    expect(DB::table('detail')->count())->toBe(0);
    expect(DB::table('tasks')->count())->toBe(0);
});
