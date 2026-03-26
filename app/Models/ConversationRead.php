<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConversationRead extends Model
{
    protected $connection = 'mysql4';
    protected $table = 'conversation_reads';

    protected $fillable = [
        'conversation_id',
        'user_id',
        'last_read_message_id',
        'last_read_at',
    ];

    protected $casts = [
        'last_read_at' => 'datetime',
    ];
}
