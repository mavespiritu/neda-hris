<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\PerformanceSuccessIndicator;

class OpcrItem extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'opcr_items';

    protected $fillable = [
        'opcr_record_id',
        'item_type',
        'category_id',
        'category_sort_order',
        'parent_item_id',
        'item_level',
        'pap_id',
        'pap_sort_order',
        'success_indicator_id',
        'success_indicator_sort_order',
        'pap_title',
        'success_indicator_title',
        'weight',
        'allocated_budget',
        'remarks',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    public function record(): BelongsTo
    {
        return $this->belongsTo(OpcrRecord::class, 'opcr_record_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(PerformanceCategory::class, 'category_id');
    }

    public function pap(): BelongsTo
    {
        return $this->belongsTo(PerformancePap::class, 'pap_id');
    }

    public function successIndicator(): BelongsTo
    {
        return $this->belongsTo(PerformanceSuccessIndicator::class, 'success_indicator_id');
    }

    public function parentItem(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_item_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(OpcrAssignment::class, 'opcr_item_id')->orderBy('id');
    }

    public function ratingRows(): HasMany
    {
        return $this->hasMany(OpcrItemRatingRow::class, 'opcr_item_id')->orderBy('sort_order')->orderBy('id');
    }
}
