<?php

namespace App\States\Raa\Transitions;

use App\Models\Raa;
use App\States\Raa\Submitted;
use Spatie\ModelStates\Transition;

class SubmitRaa extends Transition
{
    use LogsRaaHistory;

    public function __construct(
        public Raa $raa,
        public string $actedBy,
        public ?string $remarks = null
    ) {}

    public function handle(): Raa
    {
        $this->raa->raa_state = new Submitted($this->raa);
        $this->raa->save();
        $this->saveState($this->raa, 'Submitted', $this->actedBy, $this->remarks);

        return $this->raa;
    }
}
