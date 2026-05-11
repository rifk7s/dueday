<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['nama_tag'])]
class Tag extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_tag';
    protected $table = 'tags';
}
