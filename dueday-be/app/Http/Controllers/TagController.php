<?php

namespace App\Http\Controllers;

use App\Http\Resources\TagResource;
use App\Models\Tag;
use App\Services\TagService;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function __construct(private TagService $tagService) {}

    public function index()
    {
        return TagResource::collection($this->tagService->listTags());
    }

    public function show(Tag $tag)
    {
        return new TagResource($tag);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $tag = $this->tagService->createTag($data);

        return (new TagResource($tag))->response()->setStatusCode(201);
    }

    public function update(Request $request, Tag $tag)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $updated = $this->tagService->updateTag($tag->{$tag->getKeyName()}, $data);

        if (! $updated) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return new TagResource($updated);
    }

    public function destroy(Tag $tag)
    {
        $deleted = $this->tagService->deleteTag($tag->{$tag->getKeyName()});

        if (! $deleted) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->noContent();
    }
}
