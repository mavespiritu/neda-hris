<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AppAssessment extends Model
{
    protected $connection = 'mysql';

    protected $table = 'app_assessments';

    protected $fillable = [
        'application_id',
        'vacancy_id',
        'stage',
        'prescribed_status',
        'preferred_status',
        'overall_status',
        'general_remarks',
        'assessed_by',
        'assessed_at',
        'validated_from_assessment_id',
    ];

    protected $casts = [
        'assessed_at' => 'datetime',
    ];

    public function qualificationReviews(): HasMany
    {
        return $this->hasMany(AppAssessmentQualReview::class, 'app_assessment_id');
    }

    public function relevantItems(): HasMany
    {
        return $this->hasMany(AppAssessmentRelevantItem::class, 'app_assessment_id');
    }

    public function totals(): HasOne
    {
        return $this->hasOne(AppAssessmentTotal::class, 'app_assessment_id');
    }

    public function itemOverrides(): HasMany
    {
        return $this->hasMany(AppAssessmentItemOverride::class, 'app_assessment_id');
    }
}
