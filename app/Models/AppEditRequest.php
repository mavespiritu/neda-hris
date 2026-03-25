<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppEditRequest extends Model
{
    protected $connection = 'mysql';

    protected $table = 'app_edit_requests';

    protected $fillable = [
        'application_id',
        'vacancy_id',
        'remarks',
        'status',
        'opened_at',
        'expires_at',
        'closed_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'expires_at' => 'datetime',
        'closed_at' => 'datetime',
    ];
}
