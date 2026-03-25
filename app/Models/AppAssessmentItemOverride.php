<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppAssessmentItemOverride extends Model
{
    protected $connection = 'mysql';

    protected $table = 'app_assessment_item_overrides';

    protected $fillable = [
        'app_assessment_id',
        'qualification',
        'source_table',
        'source_id',
        'override_data',
    ];

    protected $casts = [
        'override_data' => 'array',
    ];

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(AppAssessment::class, 'app_assessment_id');
    }
}
