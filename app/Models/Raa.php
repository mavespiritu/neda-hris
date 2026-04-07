<?php

namespace App\Models;

use App\States\Raa\RaaState;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Raa extends Model
{
    use HasFactory;

    protected $connection = 'mysql2';
    protected $table = 'flexi_raa';
    public $timestamps = false;

    protected $casts = [
        'raa_state' => RaaState::class,
    ];

    public function getStateAttribute()
    {
        return $this->raa_state;
    }

    public function setStateAttribute($value): void
    {
        $this->setAttribute('raa_state', $value);
    }
}
