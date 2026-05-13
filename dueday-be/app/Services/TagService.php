<?php

namespace App\Services;

use App\Repositories\TagRepository;
use App\Models\Tag;

class TagService
{
    public function __construct(
        private TagRepository $tagRepository
    ) {}

    public function listTags()
    {
        return $this->tagRepository->all();
    }

    public function getTag(int $id): ?Tag
    {
        return $this->tagRepository->findById($id);
    }

    public function createTag(array $data): Tag
    {
        return $this->tagRepository->create($data);
    }

    public function updateTag(int $id, array $data): ?Tag
    {
        return $this->tagRepository->update($id, $data);
    }

    public function deleteTag(int $id): bool
    {
        return $this->tagRepository->delete($id);
    }
}
