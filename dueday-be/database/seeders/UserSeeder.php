<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{

    /**
     * Seed the users table.
     */
    public function run(): void
    {
        User::create([
            'id' => (string) Str::uuid(),
            'photo_url' => 'https://static.vecteezy.com/system/resources/thumbnails/048/334/475/small/a-person-icon-on-a-transparent-background-png.png',
            'username' => 'bglorychen',
            'nickname' => 'brit',
            'name' => 'britney',
            'email' => 'bglorychen@student.ciputra.ac.id',
            'password' => bcrypt('Password123'),
            'nim' => '0806022410020',
            'status' => 'Unsubscribed',
            'language' => 'Indonesia',
        ]);
    }
}
