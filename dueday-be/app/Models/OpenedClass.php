<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['subject_id', 'parallel', 'student_num', 'session'])]
class OpenedClass extends Model
{
    use HasFactory;

    protected $table = 'opened_class';

    public $timestamps = false;

    /**
     * Get the subject for this class.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Get the study plan cards for this class.
     */
    public function studyPlanCards(): HasMany
    {
        return $this->hasMany(StudyPlanCard::class);
    }

    /**
     * Get the assessments for this class.
     */
    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class);
    }
}
