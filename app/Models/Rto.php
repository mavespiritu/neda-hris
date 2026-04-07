<?php

namespace App\Models;

use App\States\Rto\RtoState;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rto extends Model
{
    use HasFactory;

    protected $connection = 'mysql2';
    protected $table = 'flexi_rto';
    public $timestamps = false;

    protected $casts = [
        'rto_state' => RtoState::class,
    ];

    public function getStateAttribute()
    {
        return $this->rto_state;
    }

    public function setStateAttribute($value): void
    {
        $this->setAttribute('rto_state', $value);
    }
}
