<?php

namespace Database\Seeders;

use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TagSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the tags table.
     */
    public function run(): void
    {
        $tags = ['Kuliah', 'Pekerjaan', 'Rapat', 'Rumah'];

        foreach ($tags as $tagName) {
            Tag::firstOrCreate(['name' => $tagName, 'user_id' => null]);
        }

        // Add some example local tags for each existing user (skip if already exists)
        $localTags = ['Pribadi', 'Proyek', 'Darurat'];

        foreach (User::all() as $user) {
            foreach ($localTags as $localName) {
                $exists = Tag::where('user_id', $user->id)
                    ->where('name', $localName)
                    ->exists();

                if (! $exists) {
                    Tag::create([
                        'name' => $localName,
                        'user_id' => $user->id,
                    ]);
                }
            }
        }
    }
}
