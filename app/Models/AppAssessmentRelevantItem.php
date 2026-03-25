<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppAssessmentRelevantItem extends Model
{
    protected $connection = 'mysql';

    protected $table = 'app_assessment_relevant_items';

    protected $fillable = [
        'app_assessment_id',
        'qualification',
        'source_table',
        'source_id',
    ];

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(AppAssessment::class, 'app_assessment_id');
    }
}
