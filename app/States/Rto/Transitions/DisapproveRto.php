<?php

namespace App\States\Rto\Transitions;

use App\Models\Rto;
use App\States\Rto\Disapproved;
use Spatie\ModelStates\Transition;

class DisapproveRto extends Transition
{
    use LogsRtoHistory;

    public function __construct(
        public Rto $rto,
        public string $actedBy,
        public ?string $remarks = null
    ) {}

    public function handle(): Rto
    {
        $this->rto->rto_state = new Disapproved($this->rto);
        $this->rto->save();
        $this->saveState($this->rto, 'Disapproved', $this->actedBy, $this->remarks);

        return $this->rto;
    }
}
