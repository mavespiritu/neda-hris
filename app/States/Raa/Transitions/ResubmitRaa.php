<?php

namespace App\States\Raa\Transitions;

use App\Models\Raa;
use App\States\Raa\Resubmitted;
use Spatie\ModelStates\Transition;

class ResubmitRaa extends Transition
{
    use LogsRaaHistory;

    public function __construct(
        public Raa $raa,
        public string $actedBy,
        public ?string $remarks = null
    ) {}

    public function handle(): Raa
    {
        $this->raa->raa_status_remarks = $this->remarks;
        $this->raa->raa_state = new Resubmitted($this->raa);
        $this->raa->save();

        $this->logHistory(
            raaId: (int) $this->raa->id,
            status: 'Resubmitted',
            actedBy: $this->actedBy,
            remarks: $this->remarks
        );

        return $this->raa;
    }
}
