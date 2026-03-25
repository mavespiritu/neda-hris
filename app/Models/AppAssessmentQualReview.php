<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppAssessmentQualReview extends Model
{
    protected $connection = 'mysql';

    protected $table = 'app_assessment_qual_reviews';

    protected $fillable = [
        'app_assessment_id',
        'section',
        'qualification',
        'status',
        'remarks',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(AppAssessment::class, 'app_assessment_id');
    }
}
