<?php

namespace App\States\Rto\Transitions;

use App\Models\Rto;
use App\States\Rto\Returned;
use InvalidArgumentException;
use Spatie\ModelStates\Transition;

class ReturnRto extends Transition
{
    use LogsRtoHistory;

    public function __construct(
        public Rto $rto,
        public string $actedBy,
        public string $returnToState,
        public string $returnToUser,
        public ?string $remarks = null
    ) {}

    public function handle(): Rto
    {
        $returnToState = trim($this->returnToState);
        $returnToUser = trim($this->returnToUser);

        if ($returnToState === '' || $returnToUser === '') {
            throw new InvalidArgumentException('returnToState and returnToUser are required.');
        }

        $this->rto->rto_return_to_state = $returnToState;
        $this->rto->rto_return_to_user = $returnToUser;
        $this->rto->rto_status_remarks = $this->remarks;
        $this->rto->rto_state = new Returned($this->rto);
        $this->rto->save();

        $this->saveState($this->rto, 'Needs Revision', $this->actedBy, $this->remarks);

        return $this->rto;
    }
}
