<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TagResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_tag' => $this->id_tag,
            'user_id' => $this->user_id,
            'nama_tag' => $this->nama_tag,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
