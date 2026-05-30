<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

it('rejects a non-admin user who renames themselves to the admin name', function () {
    DB::table('title')->insert([
        ['id' => 1, 'name' => 'admin'],
        ['id' => 2, 'name' => 'student'],
    ]);

    DB::table('admin')->insert([
        'id' => 1,
        'name' => 'Admin123',
        'title_id' => 1,
        'password' => bcrypt('Password123'),
    ]);

    // A normal user whose name matches the admin name must NOT gain admin access.
    $impersonator = User::query()->create([
        'id' => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'name' => 'Admin123',
        'username' => 'impersonator',
        'email' => 'impersonator@test.local',
        'password' => 'Password123',
    ]);

    expect($impersonator->isAdmin())->toBeFalse();

    $this->actingAs($impersonator)
        ->get(route('admin.elearn.majors'))
        ->assertForbidden();
});

it('allows a user with the guarded is_admin flag into the admin area', function () {
    DB::table('major')->insert([
        ['id' => 1, 'name' => 'MAN'],
    ]);

    $admin = User::query()->create([
        'id' => 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'name' => 'Real Admin',
        'username' => 'real_admin',
        'email' => 'real_admin@test.local',
        'password' => 'Password123',
    ]);

    // Granted via the guarded column, the only legitimate path to admin.
    $admin->forceFill(['is_admin' => true])->save();

    expect($admin->fresh()->isAdmin())->toBeTrue();

    $this->actingAs($admin)
        ->get(route('admin.elearn.majors'))
        ->assertOk();
});
