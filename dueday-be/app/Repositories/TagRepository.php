<?php

namespace App\Repositories;

use App\Models\Tag;

class TagRepository
{
    public function all()
    {
        return Tag::all();
    }

    public function findById(int $id): ?Tag
    {
        return Tag::find($id);
    }

    public function create(array $data): Tag
    {
        return Tag::create($data);
    }

    public function update(int $id, array $data): ?Tag
    {
        $tag = $this->findById($id);

        if (! $tag) {
            return null;
        }

        $tag->fill($data);
        $tag->save();

        return $tag;
    }

    public function delete(int $id): bool
    {
        $tag = $this->findById($id);

        if (! $tag) {
            return false;
        }

        return (bool) $tag->delete();
    }
}
