<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpcrItemRatingRow extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'opcr_item_rating_rows';

    protected $fillable = [
        'opcr_item_id',
        'success_indicator_id',
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
}
