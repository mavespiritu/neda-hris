<?php

namespace App\States\Rto\Transitions;

use App\Models\Rto;
use App\States\Rto\Endorsed;
use Spatie\ModelStates\Transition;

class EndorseRto extends Transition
{
    use LogsRtoHistory;

    public function __construct(
        public Rto $rto,
        public string $actedBy,
        public ?string $remarks = null
    ) {}

    public function handle(): Rto
    {
        $this->rto->rto_state = new Endorsed($this->rto);
        $this->rto->save();
        $this->saveState($this->rto, 'Endorsed', $this->actedBy, $this->remarks);

        return $this->rto;
    }
}
