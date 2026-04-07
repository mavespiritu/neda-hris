<?php

namespace App\States\Raa\Transitions;

use App\Models\Raa;
use App\States\Raa\Endorsed;
use Spatie\ModelStates\Transition;

class EndorseRaa extends Transition
{
    use LogsRaaHistory;

    public function __construct(
        public Raa $raa,
        public string $actedBy,
        public ?string $remarks = null
    ) {}

    public function handle(): Raa
    {
        $this->raa->raa_state = new Endorsed($this->raa);
        $this->raa->save();
        $this->saveState($this->raa, 'Endorsed', $this->actedBy, $this->remarks);

        return $this->raa;
    }
}
