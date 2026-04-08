<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformanceRating extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'performance_ratings';

    protected $fillable = [
        'name',
        'category',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    public function rows()
    {
        return $this->hasMany(PerformanceRatingRow::class, 'performance_rating_id');
    }
}
