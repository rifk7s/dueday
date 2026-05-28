<?php

namespace App\Http\Controllers;

use App\Http\Resources\TagResource;
use App\Models\Tag;
use App\Services\TagService;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function __construct(private TagService $tagService) {}

    public function index(Request $request)
    {
        return TagResource::collection($this->tagService->listTags($request->user()->id));
    }

    public function show(Request $request, Tag $tag)
    {
        $found = $this->tagService->getTagForUser($request->user()->id, $tag->{$tag->getKeyName()});

        if (! $found) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return new TagResource($found);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $tag = $this->tagService->createTag([
            ...$data,
            'user_id' => $request->user()->id,
        ]);

        return (new TagResource($tag))->response()->setStatusCode(201);
    }

    public function update(Request $request, Tag $tag)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $updated = $this->tagService->updateTag($request->user()->id, $tag->{$tag->getKeyName()}, $data);

        if (! $updated) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return new TagResource($updated);
    }

    public function destroy(Request $request, Tag $tag)
    {
        $deleted = $this->tagService->deleteTag($request->user()->id, $tag->{$tag->getKeyName()});

        if (! $deleted) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->noContent();
    }
}
