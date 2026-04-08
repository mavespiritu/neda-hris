<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformanceCategory extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'performance_categories';

    protected $fillable = [
        'category',
        'description',
        'sort_order',
        'created_by',
        'updated_by',
    ];
}
