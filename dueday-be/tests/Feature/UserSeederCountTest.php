<?php

use App\Models\User;
use Database\Seeders\UserSeeder;

it('seeds all three distinct users', function () {
    $this->seed(UserSeeder::class);

    expect(User::count())->toBe(3);
    expect(User::pluck('id')->unique()->count())->toBe(3);
    expect(
        User::whereIn('email', [
            'bglorychen@student.ciputra.ac.id',
            'mrifki01@student.ciputra.ac.id',
            'ccallistan@student.ciputra.ac.id',
        ])->count()
    )->toBe(3);
});
