<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DpcrAssignment extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'dpcr_assignments';

    protected $fillable = [
        'dpcr_record_id',
        'dpcr_item_id',
        'division_id',
        'group_id',
        'emp_id',
    ];

    public function record(): BelongsTo
    {
        return $this->belongsTo(DpcrRecord::class, 'dpcr_record_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(DpcrItem::class, 'dpcr_item_id');
    }
}
