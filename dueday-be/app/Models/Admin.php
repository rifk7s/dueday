<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['name', 'title_id', 'password'])]
class Admin extends Model
{
    use HasFactory;

    protected $table = 'admin';

    public $timestamps = false;

    /**
     * Get the title for the admin.
     */
    public function title(): BelongsTo
    {
        return $this->belongsTo(Title::class);
    }
}
