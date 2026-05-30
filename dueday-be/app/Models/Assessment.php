<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['opened_class_id', 'title', 'description', 'date', 'time', 'file_name'])]
class Assessment extends Model
{
    use HasFactory;

    protected $table = 'assessment';

    public $timestamps = false;

    /**
     * Get the opened class for this assessment.
     */
    public function openedClass(): BelongsTo
    {
        return $this->belongsTo(OpenedClass::class);
    }

    /**
     * Get the detail rows for this assessment.
     */
    public function details(): HasMany
    {
        return $this->hasMany(Detail::class);
    }
}
