<?php

namespace App\Models;

use App\States\Rto\Approved;
use App\States\Rto\Disapproved;
use App\States\Rto\Draft;
use App\States\Rto\Endorsed;
use App\States\Rto\NeedsRevision;
use App\States\Rto\Resubmitted;
use App\States\Rto\Returned;
use App\States\Rto\RtoState;
use App\States\Rto\Submitted;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

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
        $rawState = $this->getRawOriginal('rto_state');
        $state = $this->rto_state;

        if ($rawState !== null && $rawState !== Draft::class) {
            return $state;
        }

        $fallback = $this->bootstrapStateFromHistory();

        if ($fallback) {
            $this->setAttribute('rto_state', $fallback);
            return $this->rto_state;
        }

        return $state;
    }

    public function setStateAttribute($value): void
    {
        $this->setAttribute('rto_state', $value);
    }

    private function bootstrapStateFromHistory(): ?RtoState
    {
        if (! $this->exists || ! $this->getKey()) {
            return null;
        }

        $status = DB::connection($this->connection)
            ->table('submission_history')
            ->where('model', 'RTO')
            ->where('model_id', $this->getKey())
            ->orderByDesc('id')
            ->value('status');

        return match ($status) {
            'Draft' => new Draft($this),
            'Submitted' => new Submitted($this),
            'Endorsed' => new Endorsed($this),
            'Approved' => new Approved($this),
            'Disapproved' => new Disapproved($this),
            'Returned', 'Needs Revision' => new Returned($this),
            'Resubmitted' => new Resubmitted($this),
            default => null,
        };
    }
}
