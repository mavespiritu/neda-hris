<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppRankingResult extends Model
{
    protected $connection = 'mysql';

    protected $table = 'app_ranking_results';

    protected $fillable = [
        'application_id',
        'vacancy_id',
        'rank',
        'date_ranked',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date_ranked' => 'date',
    ];
}
