<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppExamResult extends Model
{
    protected $connection = 'mysql';

    protected $table = 'app_exam_results';

    protected $fillable = [
        'application_id',
        'vacancy_id',
        'test_type',
        'date_conducted',
        'status',
        'score',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date_conducted' => 'date',
    ];
}
