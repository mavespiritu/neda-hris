<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\States\VehicleRequest\VehicleRequestState;

class VehicleRequest extends Model
{
    use HasFactory;

    protected $connection = 'mysql2';
    protected $table = 'travel_order';
    public $timestamps = false;

    protected $casts = [
        'vr_state' => VehicleRequestState::class,
    ];

    public function getStateAttribute()
    {
        return $this->vr_state;
    }

    public function setStateAttribute($value): void
    {
        $this->setAttribute('vr_state', $value);
    }
}
