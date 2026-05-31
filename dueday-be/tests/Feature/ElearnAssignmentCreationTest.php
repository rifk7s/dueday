<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
    ]);

    // Grant admin via the guarded `is_admin` column (not mass-assignable).
    $admin->forceFill(['is_admin' => true])->save();

    DB::table('admin')->insert([
        'id' => 1,
        'name' => $admin->name,
        'password' => bcrypt('Password123'),
    ]);

    $studentUserOne = User::query()->create([
        'id' => 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'name' => 'Student One User',
        'username' => 'student_one',
        'email' => 'student1@test.local',
        'nim' => '0806010001',
        'password' => 'Password123',
    ]);

    $studentUserTwo = User::query()->create([
        'id' => 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'name' => 'Student Two User',
        'username' => 'student_two',
        'email' => 'student2@test.local',
        'nim' => '0806010002',
        'password' => 'Password123',
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

it('skips elearn task creation for unsubscribed users after three tasks in the current month', function () {
    DB::table('title')->insert([
        ['id' => 1, 'name' => 'admin'],
        ['id' => 2, 'name' => 'student'],
    ]);

    DB::table('major')->insert([
        ['id' => 1, 'name' => 'MAN'],
    ]);

    $admin = User::query()->create([
        'id' => 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'name' => 'Admin Tester',
        'username' => 'admin_tester_2',
        'email' => 'admin2@test.local',
        'password' => 'Password123',
    ]);

    $admin->forceFill(['is_admin' => true])->save();

    DB::table('admin')->insert([
        'id' => 1,
        'name' => $admin->name,
        'password' => bcrypt('Password123'),
    ]);

    $unsubscribedUser = User::query()->create([
        'id' => 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'name' => 'Unsubscribed User',
        'username' => 'unsubscribed_user',
        'email' => 'unsubscribed@test.local',
        'nim' => '0806010101',
        'password' => 'Password123',
        'is_subscribed' => false,
    ]);

    $otherUser = User::query()->create([
        'id' => 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        'name' => 'Other User',
        'username' => 'other_user',
        'email' => 'other@test.local',
        'nim' => '0806010102',
        'password' => 'Password123',
        'is_subscribed' => false,
    ]);

    $studentOneId = '33333333-3333-3333-3333-333333333333';
    $studentTwoId = '44444444-4444-4444-4444-444444444444';

    DB::table('students')->insert([
        [
            'id' => $studentOneId,
            'student_name' => 'Unsubscribed Student',
            'title_id' => 2,
            'current_semester' => 1,
            'nim' => '0806010101',
            'password' => bcrypt('Password123'),
        ],
        [
            'id' => $studentTwoId,
            'student_name' => 'Other Student',
            'title_id' => 2,
            'current_semester' => 1,
            'nim' => '0806010102',
            'password' => bcrypt('Password123'),
        ],
    ]);

    DB::table('reg_student')->insert([
        ['id' => 11, 'student_id' => $studentOneId, 'student_year' => 1, 'major_id' => 1],
        ['id' => 12, 'student_id' => $studentTwoId, 'student_year' => 1, 'major_id' => 1],
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
        ['id' => 11, 'period' => '2025_1', 'reg_student_id' => 11, 'opened_class_id' => 1],
        ['id' => 12, 'period' => '2025_1', 'reg_student_id' => 12, 'opened_class_id' => 1],
    ]);

    $monthCreatedAt = now()->startOfMonth()->addDay();

    for ($index = 1; $index <= 3; $index++) {
        DB::table('tasks')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $unsubscribedUser->id,
            'name' => "Existing Elearn Task {$index}",
            'source' => 'elearn',
            'status' => 'ongoing',
            'progress' => 0,
            'created_at' => $monthCreatedAt,
            'updated_at' => $monthCreatedAt,
        ]);
    }

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

    expect(DB::table('tasks')->where('user_id', $unsubscribedUser->id)->where('source', 'elearn')->count())->toBe(3);
    expect(DB::table('tasks')->where('user_id', $otherUser->id)->where('source', 'elearn')->count())->toBe(1);
    expect(DB::table('tasks')->where('source', 'elearn')->count())->toBe(4);
    expect(DB::table('detail')->count())->toBe(2);
});

it('treats an expired subscriber as free and applies the monthly cap', function () {
    DB::table('title')->insert([
        ['id' => 1, 'name' => 'admin'],
        ['id' => 2, 'name' => 'student'],
    ]);

    DB::table('major')->insert([
        ['id' => 1, 'name' => 'MAN'],
    ]);

    $admin = User::query()->create([
        'id' => 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'name' => 'Admin Tester',
        'username' => 'admin_tester_expired',
        'email' => 'admin-expired@test.local',
        'password' => 'Password123',
    ]);

    $admin->forceFill(['is_admin' => true])->save();

    DB::table('admin')->insert([
        'id' => 1,
        'name' => $admin->name,
        'password' => bcrypt('Password123'),
    ]);

    // is_subscribed is still true (only reset lazily on profile fetch) but the subscription expired,
    // so the cap must treat this user as free.
    $expiredUser = User::query()->create([
        'id' => 'abababab-abab-abab-abab-abababababab',
        'name' => 'Expired Subscriber',
        'username' => 'expired_subscriber',
        'email' => 'expired@test.local',
        'nim' => '0806010103',
        'password' => 'Password123',
        'is_subscribed' => true,
    ]);

    DB::table('subscriptions')->insert([
        'id' => (string) Str::uuid(),
        'user_id' => $expiredUser->id,
        'plan' => 'satu_bulan',
        'status' => 'active',
        'started_at' => now()->subMonths(2),
        'expired_at' => now()->subDay(),
        'created_at' => now()->subMonths(2),
        'updated_at' => now()->subMonths(2),
    ]);

    $studentId = '55555555-5555-5555-5555-555555555555';

    DB::table('students')->insert([
        'id' => $studentId,
        'student_name' => 'Expired Student',
        'title_id' => 2,
        'current_semester' => 1,
        'nim' => '0806010103',
        'password' => bcrypt('Password123'),
    ]);

    DB::table('reg_student')->insert([
        ['id' => 21, 'student_id' => $studentId, 'student_year' => 1, 'major_id' => 1],
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
        ['id' => 21, 'period' => '2025_1', 'reg_student_id' => 21, 'opened_class_id' => 1],
    ]);

    $monthCreatedAt = now()->startOfMonth()->addDay();

    for ($index = 1; $index <= 3; $index++) {
        DB::table('tasks')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $expiredUser->id,
            'name' => "Existing Elearn Task {$index}",
            'source' => 'elearn',
            'status' => 'ongoing',
            'progress' => 0,
            'created_at' => $monthCreatedAt,
            'updated_at' => $monthCreatedAt,
        ]);
    }

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

    expect(DB::table('tasks')->where('user_id', $expiredUser->id)->where('source', 'elearn')->count())->toBe(3);
});
