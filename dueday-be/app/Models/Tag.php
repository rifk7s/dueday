<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'user_id'])]
class Tag extends Model
{
    use HasFactory;

    protected $table = 'tags';

    public const GLOBAL_TAGS = ['kuliah', 'perkerjaan', 'rapat', 'rumah'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'user_id' => 'string',
        ];
    }

    /**
     * Get the owner of the tag when this is a user-local tag.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all tasks associated with this tag.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'tag_id', 'id');
    }

    /**
     * Get all activities associated with this tag.
     */
    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class, 'tag_id', 'id');
    }

    /**
     * Scope tags that are global (available to all users).
     */
    public function scopeGlobal(Builder $query): Builder
    {
        return $query->whereNull('user_id');
    }

    /**
     * Scope tags owned by the given user.
     */
    public function scopeLocalToUser(Builder $query, string $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope tags visible to the given user (global + user-owned).
     */
    public function scopeVisibleToUser(Builder $query, string $userId): Builder
    {
        return $query->where(function (Builder $builder) use ($userId): void {
            $builder->whereNull('user_id')->orWhere('user_id', $userId);
        });
    }

    /**
     * Determine whether this tag is global.
     */
    public function isGlobal(): bool
    {
        return $this->user_id === null;
    }

    // Name column is 'name' in DB (keeps original global tag strings)
    public function getNameAttribute(): ?string
    {
        return $this->attributes['name'] ?? null;
    }

    public function setNameAttribute(?string $value): void
    {
        $this->attributes['name'] = $value;
    }
}
