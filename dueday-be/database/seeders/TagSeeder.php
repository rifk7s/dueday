<?php

namespace Database\Seeders;

use App\Models\Tag;
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
            Tag::create(['nama_tag' => $tagName]);
        }
    }
}
