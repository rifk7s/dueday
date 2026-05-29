<?php

namespace App\Repositories;

use App\Models\Tag;

class TagRepository
{
    /**
     * Get tags visible to the given user (global tags + the user's own tags).
     */
    public function visibleToUser(string $userId)
    {
        return Tag::visibleToUser($userId)->get();
    }

    public function findById(int $id): ?Tag
    {
        return Tag::find($id);
    }

    public function create(array $data): Tag
    {
        return Tag::create($data);
    }

    /**
     * Create the tag, or return the existing one for this (user_id, name).
     *
     * Race-safe: relies on the unique(['user_id', 'name']) constraint and ACID
     * semantics instead of a select-then-insert, so concurrent identical creates
     * resolve to a single row without a duplicate-key error.
     *
     * @param  array{name: string, user_id: ?string}  $data
     */
    public function createOrFirst(array $data): Tag
    {
        return Tag::createOrFirst([
            'user_id' => $data['user_id'] ?? null,
            'name' => $data['name'],
        ]);
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
