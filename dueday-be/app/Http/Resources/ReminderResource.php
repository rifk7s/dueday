<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReminderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'isi_reminder' => $this->isi_reminder,
            'jenis' => $this->jenis,
            'waktu' => $this->waktu,
            'suara_notifikasi' => $this->suara_notifikasi,
            'gaya_pesan' => $this->gaya_pesan,
            'frekuensi' => $this->frekuensi,
            'getaran' => $this->getaran,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
