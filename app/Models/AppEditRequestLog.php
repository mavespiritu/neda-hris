<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppEditRequestLog extends Model
{
    protected $connection = 'mysql';

    protected $table = 'app_edit_request_logs';

    protected $fillable = [
        'app_edit_request_id',
        'action',
        'remarks',
        'acted_by',
        'acted_at',
    ];

    protected $casts = [
        'acted_at' => 'datetime',
    ];
}
