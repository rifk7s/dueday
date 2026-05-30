<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['student_id', 'student_year', 'major_id'])]
class RegStudent extends Model
{
    use HasFactory;

    protected $table = 'reg_student';

    public $timestamps = false;

    /**
     * Get the student for this registration row.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the major for this registration row.
     */
    public function major(): BelongsTo
    {
        return $this->belongsTo(Major::class);
    }

    /**
     * Get the study plan cards for this student registration.
     */
    public function studyPlanCards(): HasMany
    {
        return $this->hasMany(StudyPlanCard::class);
    }

    /**
     * Get the details for this student registration.
     */
    public function details(): HasMany
    {
        return $this->hasMany(Detail::class);
    }
}
