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
        'state' => VehicleRequestState::class,
    ];
}
