<?php

namespace App\Http\Controllers;

use App\Services\TagService;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TagController extends Controller
{
    public function __construct(private TagService $tagService) {}

    public function index()
    {
        return response()->json($this->tagService->listTags());
    }

    public function show(Tag $tag)
    {
        return response()->json($tag);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama_tag' => 'required|string|max:255',
        ]);

        $tag = $this->tagService->createTag($data);

        return response()->json($tag, 201);
    }

    public function update(Request $request, Tag $tag)
    {
        $data = $request->validate([
            'nama_tag' => 'required|string|max:255',
        ]);

        $updated = $this->tagService->updateTag($tag->{$tag->getKeyName()}, $data);

        if (! $updated) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($updated);
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
