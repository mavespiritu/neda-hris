<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformanceLibraryItem extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'performance_library_items';

    protected $fillable = [
        'item_type',
        'parent_id',
        'code',
        'title',
        'description',
        'scope',
        'indicator_type',
        'target',
        'unit',
        'sort_order',
        'is_active',
        'created_by',
        'updated_by',
    ];
}
