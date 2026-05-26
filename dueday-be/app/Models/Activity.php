<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['id', 'user_id', 'tag_id', 'name', 'date', 'anchor_date', 'time_start', 'time_end', 'status', 'progress', 'progress_started_at', 'description', 'recurrence'])]
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
            'date' => 'date',
            'anchor_date' => 'date',
            'progress' => 'integer',
            'progress_started_at' => 'datetime',
            'user_id' => 'string',
            'tag_id' => 'integer',
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
        return $this->belongsTo(Tag::class, 'tag_id', 'id');
    }
}
