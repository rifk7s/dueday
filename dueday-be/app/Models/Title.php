<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name'])]
class Title extends Model
{
    use HasFactory;

    protected $table = 'title';

    public $timestamps = false;

    /**
     * Get the admins that use this title.
     */
    public function admins(): HasMany
    {
        return $this->hasMany(Admin::class);
    }

    /**
     * Get the students that use this title.
     */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'title_id', 'id');
    }
}
