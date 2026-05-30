<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['period', 'reg_student_id', 'opened_class_id'])]
class StudyPlanCard extends Model
{
    use HasFactory;

    protected $table = 'study_plan_card';

    public $timestamps = false;

    /**
     * Get the registration record for this study plan card.
     */
    public function regStudent(): BelongsTo
    {
        return $this->belongsTo(RegStudent::class);
    }

    /**
     * Get the opened class for this study plan card.
     */
    public function openedClass(): BelongsTo
    {
        return $this->belongsTo(OpenedClass::class);
    }
}
