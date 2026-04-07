<?php

namespace App\States\Rto\Transitions;

use App\Models\Rto;
use App\States\Rto\Resubmitted;
use Spatie\ModelStates\Transition;

class ResubmitRto extends Transition
{
    use LogsRtoHistory;

    public function __construct(
        public Rto $rto,
        public string $actedBy,
        public ?string $remarks = null
    ) {}

    public function handle(): Rto
    {
        $from = $this->rto->state->label();

        $this->rto->rto_status_remarks = $this->remarks;
        $this->rto->rto_state = new Resubmitted($this->rto);
        $this->rto->save();

        $this->logHistory(
            rtoId: (int) $this->rto->id,
            status: 'Resubmitted',
            actedBy: $this->actedBy,
            remarks: $this->remarks
        );

        return $this->rto;
    }
}
