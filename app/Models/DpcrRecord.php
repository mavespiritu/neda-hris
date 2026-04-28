<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\States\Opcr\OpcrState;

class DpcrRecord extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'dpcr_records';

    protected $fillable = [
        'source_opcr_record_id',
        'division_id',
        'year',
        'period_type',
        'period_no',
        'title',
        'state',
        'state_remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'state' => OpcrState::class,
    ];

    public function items(): HasMany
    {
        return $this->hasMany(DpcrItem::class, 'dpcr_record_id');
    }
}
