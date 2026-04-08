<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpcrAssignment extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'opcr_assignments';

    protected $fillable = [
        'opcr_record_id',
        'opcr_item_id',
        'division_id',
        'group_id',
        'emp_id',
    ];

    public function record(): BelongsTo
    {
        return $this->belongsTo(OpcrRecord::class, 'opcr_record_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(OpcrItem::class, 'opcr_item_id');
    }
}
