<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppAssessmentTotal extends Model
{
    protected $connection = 'mysql';

    protected $table = 'app_assessment_totals';

    protected $fillable = [
        'app_assessment_id',
        'relevant_training_hours',
        'relevant_experience_days',
        'relevant_experience_years',
        'relevant_experience_months',
        'relevant_experience_display',
        'cutoff_date',
    ];

    protected $casts = [
        'cutoff_date' => 'date',
    ];

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(AppAssessment::class, 'app_assessment_id');
    }
}
