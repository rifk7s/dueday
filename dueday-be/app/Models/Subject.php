<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'major_id', 'semester', 'sks', 'period'])]
class Subject extends Model
{
    use HasFactory;

    protected $table = 'subject';

    public $timestamps = false;

    /**
     * Get the major for this subject.
     */
    public function major(): BelongsTo
    {
        return $this->belongsTo(Major::class);
    }

    /**
     * Get the opened classes for this subject.
     */
    public function openedClasses(): HasMany
    {
        return $this->hasMany(OpenedClass::class, 'subject_id', 'id');
    }
}
