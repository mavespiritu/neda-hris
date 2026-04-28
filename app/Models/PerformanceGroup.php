<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformanceGroup extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'groups';

    protected $fillable = [
        'name',
        'description',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    public function members()
    {
        return $this->hasMany(PerformanceGroupMember::class, 'group_id')->orderBy('sort_order')->orderBy('id');
    }
}
