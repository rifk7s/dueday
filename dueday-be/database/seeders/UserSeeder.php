<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'id' => 'bb0efa5c-bf07-4a72-be22-4f68a210b0c0',
            'email' => 'bglorychen@student.ciputra.ac.id',
            'username' => 'bglorychen',
            'nickname' => 'brit',
            'name' => 'britney',
            'password' => Hash::make('Password123'),
            'nim' => '0806022410020',
            'is_subscribed' => false,
            'language' => 'Indonesia',
        ],
        [
            'id' => 'bb0efa5c-bf07-4a72-be22-4f68a210b0c0',
            'email' => 'mrifki01@student.ciputra.ac.id',
            'username' => 'mrifki01',
            'nickname' => 'rifki',
            'name' => 'Rifki',
            'password' => Hash::make('Password123'),
            'nim' => '0806022410017',
            'is_subscribed' => false,
            'language' => 'Indonesia',
        ],
        [
            'id' => 'bb0efa5c-bf07-4a72-be22-4f68a210b0c0',
            'email' => 'ccallistan@student.ciputra.ac.id',
            'username' => 'ccallistan',
            'nickname' => 'cherryl',
            'name' => 'Cherryl',
            'password' => Hash::make('Password123'),
            'nim' => '0806022410023',
            'is_subscribed' => false,
            'language' => 'Indonesia',
        ],
        );
    }
}
