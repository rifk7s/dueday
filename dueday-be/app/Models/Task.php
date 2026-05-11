<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['id', 'user_id', 'id_tag', 'task_name', 'date', 'time', 'priority', 'status', 'source', 'deskripsi', 'progress', 'goals', 'goal_points'])]
class Task extends Model
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
            'time' => 'datetime:H:i:s',
            'progress' => 'integer',
            'user_id' => 'string',
            'id_tag' => 'integer',
            'goal_points' => 'json',
        ];
    }

    /**
     * Get the user that owns the task.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the tag for the task.
     */
    public function tag()
    {
        return $this->belongsTo(Tag::class, 'id_tag', 'id_tag');
    }
}
