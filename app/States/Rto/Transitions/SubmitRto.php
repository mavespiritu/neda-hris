<?php

namespace App\States\Rto\Transitions;

use App\Models\Rto;
use App\States\Rto\Submitted;
use Spatie\ModelStates\Transition;

class SubmitRto extends Transition
{
    use LogsRtoHistory;

    public function __construct(
        public Rto $rto,
        public string $actedBy,
        public ?string $remarks = null
    ) {}

    public function handle(): Rto
    {
        $this->rto->rto_state = new Submitted($this->rto);
        $this->rto->save();
        $this->saveState($this->rto, 'Submitted', $this->actedBy, $this->remarks);

        return $this->rto;
    }
}
