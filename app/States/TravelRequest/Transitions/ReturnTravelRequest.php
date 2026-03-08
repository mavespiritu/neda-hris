<?php

namespace App\States\TravelRequest\Transitions;

use App\Models\TravelRequest;
use App\States\TravelRequest\Returned;
use Spatie\ModelStates\Transition;
use InvalidArgumentException;

class ReturnTravelRequest extends Transition
{
    use LogsTravelRequestHistory;

    public function __construct(
        public TravelRequest $travelRequest,
        public string $actedBy,
        public string $returnToState,
        public string $returnToUser,
        public ?string $remarks = null,
        public bool $notify = true
    ) {}

    public function handle(): TravelRequest
    {
        $from = $this->travelRequest->state->label();

        $returnToState = trim($this->returnToState);
        $returnToUser = trim($this->returnToUser);

        if ($returnToState === '' || $returnToUser === '') {
            throw new InvalidArgumentException('returnToState and returnToUser are required.');
        }

        $this->travelRequest->tr_return_to_state = $returnToState;
        $this->travelRequest->tr_return_to_user = $returnToUser;
        $this->travelRequest->tr_status_remarks = $this->remarks;

        $this->travelRequest->tr_state = new Returned($this->travelRequest);
        $this->travelRequest->save();

        $this->logAndDispatch(
            travelRequest: $this->travelRequest,
            action: 'returned',
            fromState: $from,
            toState: 'Returned',
            actedBy: $this->actedBy,
            remarks: $this->remarks,
            returnToState: $returnToState,
            returnToUser: $returnToUser,
            notify: $this->notify
        );

        return $this->travelRequest;
    }
}
