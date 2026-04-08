<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformanceSuccessIndicator extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'performance_success_indicators';

    protected $fillable = [
        'level',
        'category',
        'performance_activity_id',
        'performance_rating_id',
        'target',
        'measurement',
        'division_assignments',
        'group_assignments',
        'employee_assignments',
        'weight',
        'budget',
        'accountable',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'division_assignments' => 'array',
        'group_assignments' => 'array',
        'employee_assignments' => 'array',
    ];

    public function activity()
    {
        return $this->belongsTo(PerformanceActivity::class, 'performance_activity_id');
    }

    public function rating()
    {
        return $this->belongsTo(PerformanceRating::class, 'performance_rating_id');
    }
}
