<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Ppmp\Activity;
use App\Models\PerformanceRating;
use App\Models\Ppmp\SubActivity;

class DpcrItem extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'dpcr_items';

    protected $fillable = [
        'dpcr_record_id',
        'source_opcr_item_id',
        'item_type',
        'category_id',
        'category_sort_order',
        'parent_item_id',
        'item_level',
        'activity_id',
        'sub_activity_id',
        'specific_activity_output',
        'unit_of_measure',
        'target_plan',
        'performance_rating_id',
        'pap_id',
        'pap_sort_order',
        'success_indicator_id',
        'success_indicator_sort_order',
        'pap_title',
        'success_indicator_title',
        'weight',
        'allocated_budget',
        'remarks',
        'target_jan',
        'target_feb',
        'target_mar',
        'target_apr',
        'target_may',
        'target_jun',
        'target_jul',
        'target_aug',
        'target_sep',
        'target_oct',
        'target_nov',
        'target_dec',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'target_plan' => 'array',
    ];

    public function record(): BelongsTo
    {
        return $this->belongsTo(DpcrRecord::class, 'dpcr_record_id');
    }

    public function parentItem(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_item_id');
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class, 'activity_id');
    }

    public function subActivity(): BelongsTo
    {
        return $this->belongsTo(SubActivity::class, 'sub_activity_id');
    }

    public function rating(): BelongsTo
    {
        return $this->belongsTo(PerformanceRating::class, 'performance_rating_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(DpcrAssignment::class, 'dpcr_item_id')->orderBy('id');
    }

    public function ratingRows(): HasMany
    {
        return $this->hasMany(DpcrItemRatingRow::class, 'dpcr_item_id')->orderBy('sort_order')->orderBy('id');
    }
}
