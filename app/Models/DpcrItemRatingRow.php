<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DpcrItemRatingRow extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'dpcr_item_rating_rows';

    protected $fillable = [
        'dpcr_item_id',
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

    public function item(): BelongsTo
    {
        return $this->belongsTo(DpcrItem::class, 'dpcr_item_id');
    }
}
