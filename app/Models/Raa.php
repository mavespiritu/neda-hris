<?php

namespace App\Models;

use App\States\Raa\Approved;
use App\States\Raa\Disapproved;
use App\States\Raa\Draft;
use App\States\Raa\Endorsed;
use App\States\Raa\NeedsRevision;
use App\States\Raa\RaaState;
use App\States\Raa\Resubmitted;
use App\States\Raa\Returned;
use App\States\Raa\Submitted;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

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
        $rawState = $this->getRawOriginal('raa_state');

        if ($rawState === null) {
            return $this->bootstrapStateFromHistory() ?? $this->makeState(Draft::class);
        }

        if ($rawState === Draft::class) {
            return $this->bootstrapStateFromHistory() ?? $this->makeState(Draft::class);
        }

        if (is_string($rawState) && class_exists($rawState)) {
            return $this->makeState($rawState);
        }

        return $this->bootstrapStateFromHistory() ?? $this->makeState(Draft::class);
    }

    public function setStateAttribute($value): void
    {
        $this->setAttribute('raa_state', $value);
    }

    private function bootstrapStateFromHistory(): ?RaaState
    {
        if (! $this->exists || ! $this->getKey()) {
            return null;
        }

        $status = DB::connection($this->connection)
            ->table('submission_history')
            ->where('model', 'RAA')
            ->where('model_id', $this->getKey())
            ->orderByDesc('id')
            ->value('status');

        return match ($status) {
            'Draft' => $this->makeState(Draft::class),
            'Submitted' => $this->makeState(Submitted::class),
            'Endorsed' => $this->makeState(Endorsed::class),
            'Approved' => $this->makeState(Approved::class),
            'Disapproved' => $this->makeState(Disapproved::class),
            'Returned', 'Needs Revision' => $this->makeState(Returned::class),
            'Resubmitted' => $this->makeState(Resubmitted::class),
            default => null,
        };
    }

    private function makeState(string $stateClass): RaaState
    {
        /** @var RaaState $state */
        $state = new $stateClass($this);
        $state->setField('raa_state');

        return $state;
    }
}
