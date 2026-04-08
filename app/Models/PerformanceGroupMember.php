<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformanceGroupMember extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'group_members';

    protected $fillable = [
        'performance_group_id',
        'employee_ipms_id',
        'sort_order',
    ];

    public function group()
    {
        return $this->belongsTo(PerformanceGroup::class, 'performance_group_id');
    }
}
