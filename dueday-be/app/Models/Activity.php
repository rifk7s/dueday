<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['id', 'user_id', 'id_tag', 'activity_name', 'tanggal', 'time_start', 'time_end', 'status', 'progress', 'deskripsi', 'ulangi'])]
class Activity extends Model
{
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'progress' => 'integer',
            'user_id' => 'string',
            'id_tag' => 'integer',
        ];
    }

    /**
     * Get the user that owns the activity.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the tag for the activity.
     */
    public function tag(): BelongsTo
    {
        return $this->belongsTo(Tag::class, 'id_tag', 'id_tag');
    }
}
