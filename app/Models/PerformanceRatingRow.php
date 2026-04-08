<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformanceRatingRow extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'performance_rating_rows';

    protected $fillable = [
        'performance_rating_id',
        'rating_dimension',
        'score',
        'enabled',
        'condition_type',
        'condition_text',
        'meaning',
        'value_from',
        'value_to',
        'unit',
        'timing',
        'sort_order',
    ];

    public function rating()
    {
        return $this->belongsTo(PerformanceRating::class, 'performance_rating_id');
    }
}
