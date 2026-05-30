<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name'])]
class Major extends Model
{
    use HasFactory;

    protected $table = 'major';

    public $timestamps = false;

    /**
     * Get the registration records for this major.
     */
    public function regStudents(): HasMany
    {
        return $this->hasMany(RegStudent::class);
    }

    /**
     * Get the subjects for this major.
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }
}
