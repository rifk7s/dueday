<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'username' => 'bglorychen',
            'nickname' => 'brit',
            'name' => 'britney',
            'email' => 'bglorychen@student.ciputra.ac.id',
            'password' => bcrypt('Password123'),
            'nim' => '0806022410020',
            'status' => 'Unsubscribed',
            'language' => 'Indonesia',
            'google_access_token' => null,
            'google_refresh_token' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
