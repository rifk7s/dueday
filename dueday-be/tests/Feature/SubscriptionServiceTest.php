<?php

use App\Models\Subscription;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Services\SubscriptionService;
use Carbon\Carbon;
use Illuminate\Support\Str;

test('activateOrExtendUserSubscription picks the latest-expiring active subscription when multiple exist', function () {
    $user = User::factory()->create();

    // Two active subscriptions for the same user — earlier one was created later in source
    // order so a naive .first() would return the wrong row.
    $earlier = Subscription::factory()->create([
        'user_id' => $user->id,
        'plan' => 'satu_bulan',
        'status' => 'active',
        'started_at' => Carbon::now()->subDays(20),
        'expired_at' => Carbon::now()->addDays(10),
    ]);

    $later = Subscription::factory()->create([
        'user_id' => $user->id,
        'plan' => 'satu_tahun',
        'status' => 'active',
        'started_at' => Carbon::now()->subDays(5),
        'expired_at' => Carbon::now()->addMonths(11),
    ]);

    app(SubscriptionService::class)->activateOrExtendUserSubscription($user->id, 'satu_tahun', 12);

    $later->refresh();
    $earlier->refresh();

    // The later-expiring subscription should have been extended by 12 months past its current expiry.
    expect(Carbon::parse($later->expired_at)->greaterThan(Carbon::now()->addMonths(22)))
        ->toBeTrue('later subscription should have been extended ~12 months past its existing expiry');

    // The earlier-expiring subscription must NOT have been touched.
    expect(Carbon::parse($earlier->expired_at)->isSameDay(Carbon::now()->addDays(10)))->toBeTrue();
});

test('activateOrExtendUserSubscription backfills missed elearn tasks for newly subscribed users', function () {
    DB::table('title')->insert([
        ['id' => 1, 'name' => 'student'],
    ]);

    DB::table('major')->insert([
        ['id' => 1, 'name' => 'MAN'],
    ]);

    $user = User::query()->create([
        'id' => '99999999-9999-9999-9999-999999999999',
        'name' => 'Premium Later User',
        'username' => 'premium_later',
        'email' => 'premium-later@test.local',
        'nim' => '0806019901',
        'password' => 'Password123',
        'is_subscribed' => false,
    ]);

    $studentId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    DB::table('students')->insert([
        'id' => $studentId,
        'student_name' => $user->name,
        'title_id' => 1,
        'current_semester' => 1,
        'nim' => $user->nim,
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
            'title' => 'Management Basics Assignment 1',
            'description' => 'First assignment',
            'date' => now()->subWeeks(2)->toDateString(),
            'time' => '09:00:00',
        ],
        [
            'id' => 2,
            'opened_class_id' => 1,
            'title' => 'Management Basics Assignment 2',
            'description' => 'Second assignment',
            'date' => now()->subWeek()->toDateString(),
            'time' => '10:00:00',
        ],
    ]);

    DB::table('detail')->insert([
        [
            'id' => 1,
            'assessment_id' => 1,
            'reg_student_id' => 1,
            'file_name' => 'pdf',
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

    expect(DB::table('tasks')->where('user_id', $user->id)->where('source', 'elearn')->count())->toBe(0);

    app(SubscriptionService::class)->activateOrExtendUserSubscription($user->id, 'satu_tahun', 12);

    expect($user->refresh()->is_subscribed)->toBeTrue();
    expect(DB::table('tasks')->where('user_id', $user->id)->where('source', 'elearn')->count())->toBe(2);
    expect(DB::table('tasks')->where('user_id', $user->id)->where('elearn_assessment_id', 1)->exists())->toBeTrue();
    expect(DB::table('tasks')->where('user_id', $user->id)->where('elearn_assessment_id', 2)->exists())->toBeTrue();
});

test('backfill adopts legacy elearn tasks instead of duplicating them', function () {
    DB::table('title')->insert([['id' => 1, 'name' => 'student']]);
    DB::table('major')->insert([['id' => 1, 'name' => 'MAN']]);

    $user = User::query()->create([
        'id' => '88888888-8888-8888-8888-888888888888',
        'name' => 'Legacy Task User',
        'username' => 'legacy_task_user',
        'email' => 'legacy@test.local',
        'nim' => '0806019902',
        'password' => 'Password123',
        'is_subscribed' => false,
    ]);

    $studentId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

    DB::table('students')->insert([
        'id' => $studentId,
        'student_name' => $user->name,
        'title_id' => 1,
        'current_semester' => 1,
        'nim' => $user->nim,
        'password' => bcrypt('Password123'),
    ]);

    DB::table('reg_student')->insert([
        'id' => 1, 'student_id' => $studentId, 'student_year' => 1, 'major_id' => 1,
    ]);

    DB::table('subject')->insert([
        'id' => 1, 'name' => 'Management Basics', 'major_id' => 1, 'semester' => 1, 'sks' => 3, 'period' => '2025_1',
    ]);

    DB::table('opened_class')->insert([
        'id' => 1, 'subject_id' => 1, 'parallel' => 'A', 'student_num' => 30, 'session' => 16,
    ]);

    DB::table('study_plan_card')->insert([
        'id' => 1, 'period' => '2025_1', 'reg_student_id' => 1, 'opened_class_id' => 1,
    ]);

    $assessmentDate = now()->subWeek()->toDateString();

    DB::table('assessment')->insert([
        'id' => 1,
        'opened_class_id' => 1,
        'title' => 'Legacy Assignment',
        'description' => 'Legacy description',
        'date' => $assessmentDate,
        'time' => '09:00:00',
    ]);

    DB::table('detail')->insert([
        'id' => 1, 'assessment_id' => 1, 'reg_student_id' => 1, 'file_name' => 'pdf', 'nilai' => null,
    ]);

    // A legacy task created before the elearn_assessment_id column existed: matching title /
    // description / date but a NULL id. The backfill must adopt it, not insert a duplicate.
    $legacyTaskId = (string) Str::uuid();
    DB::table('tasks')->insert([
        'id' => $legacyTaskId,
        'user_id' => $user->id,
        'name' => 'Legacy Assignment',
        'description' => 'Legacy description',
        'due_date' => $assessmentDate,
        'source' => 'elearn',
        'status' => 'ongoing',
        'progress' => 0,
        'elearn_assessment_id' => null,
        'created_at' => now()->subWeek(),
        'updated_at' => now()->subWeek(),
    ]);

    app(SubscriptionService::class)->activateOrExtendUserSubscription($user->id, 'satu_bulan', 1);

    expect(DB::table('tasks')->where('user_id', $user->id)->where('source', 'elearn')->count())->toBe(1);
    expect(DB::table('tasks')->where('id', $legacyTaskId)->value('elearn_assessment_id'))->toBe(1);
});

test('a sync failure rolls back the subscription activation', function () {
    $user = User::factory()->create(['is_subscribed' => false]);

    // Force a failure after the subscription row is written but before the flag/sync commits.
    $this->mock(UserRepository::class, function ($mock) use ($user) {
        $mock->shouldReceive('findById')->andReturn($user);
        $mock->shouldReceive('update')->andThrow(new RuntimeException('sync boom'));
    });

    expect(fn () => app(SubscriptionService::class)->activateOrExtendUserSubscription($user->id, 'satu_bulan', 1))
        ->toThrow(RuntimeException::class);

    expect(DB::table('subscriptions')->where('user_id', $user->id)->count())->toBe(0);
    expect($user->refresh()->is_subscribed)->toBeFalse();
});
