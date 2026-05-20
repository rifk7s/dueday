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
            
            // 🔄 FIXED: Changed from 'Unsubscribed' to lowercase 'unsubscribed'
            'status' => 'unsubscribed', 
            
            'language' => 'Indonesia',
        ]);
    }
}