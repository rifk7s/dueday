<?php

namespace App\Services;

use App\Models\Tag;
use App\Repositories\TagRepository;

class TagService
{
    public function __construct(
        private TagRepository $tagRepository
    ) {}

    /**
     * List tags visible to the user: global tags plus the user's own tags.
     */
    public function listTags(string $userId)
    {
        return $this->tagRepository->visibleToUser($userId);
    }

    /**
     * Get a tag the user is allowed to see (global or owned), otherwise null.
     */
    public function getTagForUser(string $userId, int $id): ?Tag
    {
        $tag = $this->tagRepository->findById($id);

        if ($tag && ($tag->user_id === null || $tag->user_id === $userId)) {
            return $tag;
        }

        return null;
    }

    public function createTag(array $data): Tag
    {
        return $this->tagRepository->createOrFirst($data);
    }

    /**
     * Update a tag the user owns. Global tags and other users' tags are off-limits.
     */
    public function updateTag(string $userId, int $id, array $data): ?Tag
    {
        $tag = $this->tagRepository->findById($id);

        if (! $tag || $tag->user_id !== $userId) {
            return null;
        }

        return $this->tagRepository->update($id, $data);
    }

    /**
     * Delete a tag the user owns. Global tags and other users' tags are off-limits.
     */
    public function deleteTag(string $userId, int $id): bool
    {
        $tag = $this->tagRepository->findById($id);

        if (! $tag || $tag->user_id !== $userId) {
            return false;
        }

        return $this->tagRepository->delete($id);
    }
}
