<?php

namespace App\States\Raa\Transitions;

use App\Models\Raa;
use App\States\Raa\Returned;
use InvalidArgumentException;
use Spatie\ModelStates\Transition;

class ReturnRaa extends Transition
{
    use LogsRaaHistory;

    public function __construct(
        public Raa $raa,
        public string $actedBy,
        public string $returnToState,
        public string $returnToUser,
        public ?string $remarks = null
    ) {}

    public function handle(): Raa
    {
        $returnToState = trim($this->returnToState);
        $returnToUser = trim($this->returnToUser);

        if ($returnToState === '' || $returnToUser === '') {
            throw new InvalidArgumentException('returnToState and returnToUser are required.');
        }

        $this->raa->raa_return_to_state = $returnToState;
        $this->raa->raa_return_to_user = $returnToUser;
        $this->raa->raa_status_remarks = $this->remarks;
        $this->raa->raa_state = new Returned($this->raa);
        $this->raa->save();

        $this->saveState($this->raa, 'Needs Revision', $this->actedBy, $this->remarks);

        return $this->raa;
    }
}
