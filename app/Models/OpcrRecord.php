<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\States\Opcr\OpcrState;

class OpcrRecord extends Model
{
    protected $connection = 'mysql2';

    protected $table = 'opcr_records';

    protected $fillable = [
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
        return $this->hasMany(OpcrItem::class, 'opcr_record_id');
    }
}
