<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformanceActivity extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'performance_activities';

    protected $fillable = [
        'activity_output',
        'description',
        'sort_order',
        'created_by',
        'updated_by',
    ];
}
