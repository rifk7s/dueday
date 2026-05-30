<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

it('creates a detail row for every enrolled student when an assignment is created', function () {
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
        'role' => 'admin',
    ]);

    $studentUserOne = User::query()->create([
        'id' => 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'name' => 'Student One User',
        'username' => 'student_one',
        'email' => 'student1@test.local',
        'nim' => '0806010001',
        'password' => 'Password123',
        'role' => 'student',
    ]);

    $studentUserTwo = User::query()->create([
        'id' => 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'name' => 'Student Two User',
        'username' => 'student_two',
        'email' => 'student2@test.local',
        'nim' => '0806010002',
        'password' => 'Password123',
        'role' => 'student',
    ]);

    $studentOneId = '11111111-1111-1111-1111-111111111111';
    $studentTwoId = '22222222-2222-2222-2222-222222222222';

    DB::table('students')->insert([
        [
            'id' => $studentOneId,
            'student_name' => 'Student One',
            'title_id' => 2,
            'current_semester' => 1,
            'nim' => '0806010001',
            'password' => bcrypt('Password123'),
        ],
        [
            'id' => $studentTwoId,
            'student_name' => 'Student Two',
            'title_id' => 2,
            'current_semester' => 1,
            'nim' => '0806010002',
            'password' => bcrypt('Password123'),
        ],
    ]);

    DB::table('reg_student')->insert([
        ['id' => 1, 'student_id' => $studentOneId, 'student_year' => 1, 'major_id' => 1],
        ['id' => 2, 'student_id' => $studentTwoId, 'student_year' => 1, 'major_id' => 1],
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
        ['id' => 1, 'period' => '2025_1', 'reg_student_id' => 1, 'opened_class_id' => 1],
        ['id' => 2, 'period' => '2025_1', 'reg_student_id' => 2, 'opened_class_id' => 1],
    ]);

    $this->actingAs($admin)
        ->post(route('admin.elearn.assignments.store', ['major' => 1]), [
            'opened_class_id' => 1,
            'title' => 'Management Basics Assignment',
            'description' => 'Assignment for Management Basics',
            'date' => now()->toDateString(),
            'time' => '09:00',
            'file_name' => 'pdf',
        ])
        ->assertRedirect(route('admin.elearn.assignments', ['major' => 1]));

    expect(DB::table('assessment')->count())->toBe(1);
    expect(DB::table('detail')->count())->toBe(2);
    expect(DB::table('detail')->pluck('reg_student_id')->all())->toBe([1, 2]);
    expect(DB::table('detail')->pluck('nilai')->all())->toBe([null, null]);
    expect(DB::table('detail')->pluck('file_name')->all())->toBe(['pdf', 'pdf']);
    expect(DB::table('tasks')->count())->toBe(2);
    expect(DB::table('tasks')->pluck('user_id')->all())->toBe([$studentUserOne->id, $studentUserTwo->id]);
    expect(DB::table('tasks')->pluck('name')->all())->toBe(['Management Basics Assignment', 'Management Basics Assignment']);
    expect(DB::table('tasks')->pluck('due_date')->all())->toBe([now()->startOfDay()->toDateTimeString(), now()->startOfDay()->toDateTimeString()]);
    expect(DB::table('tasks')->pluck('due_time')->all())->toBe(['09:00', '09:00']);
    expect(DB::table('tasks')->pluck('description')->all())->toBe(['Assignment for Management Basics', 'Assignment for Management Basics']);
    expect(DB::table('tasks')->pluck('source')->all())->toBe(['elearn', 'elearn']);
});