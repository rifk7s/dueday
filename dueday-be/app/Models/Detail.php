<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['assessment_id', 'reg_student_id', 'file_name', 'nilai', 'submission_text', 'submission_file_path', 'submitted_at'])]
class Detail extends Model
{
    use HasFactory;

    protected $table = 'detail';

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    /**
     * Get the assessment for this detail.
     */
    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    /**
     * Get the registration record for this detail.
     */
    public function regStudent(): BelongsTo
    {
        return $this->belongsTo(RegStudent::class);
    }
}
