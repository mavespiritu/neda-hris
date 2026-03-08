<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\States\TravelRequest\TravelRequestState;

class TravelRequest extends Model
{
    use HasFactory;

    protected $connection = 'mysql2';
    protected $table = 'travel_order';
    public $timestamps = false;

    protected $casts = [
        'tr_state' => TravelRequestState::class,
    ];

    public function getStateAttribute()
    {
        return $this->tr_state;
    }

    public function setStateAttribute($value): void
    {
        $this->setAttribute('tr_state', $value);
    }
}
