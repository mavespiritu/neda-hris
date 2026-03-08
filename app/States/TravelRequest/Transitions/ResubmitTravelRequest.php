<?php

namespace App\States\TravelRequest\Transitions;

use App\Models\TravelRequest;
use App\States\TravelRequest\Resubmitted;
use Spatie\ModelStates\Transition;

class ResubmitTravelRequest extends Transition
{
    use LogsTravelRequestHistory;

    public function __construct(
        public TravelRequest $travelRequest,
        public string $actedBy,
        public ?string $remarks = null,
        public bool $notify = true
    ) {}

    public function handle(): TravelRequest
    {
        $from = $this->travelRequest->state->label();

        $this->travelRequest->tr_status_remarks = $this->remarks;
        $this->travelRequest->tr_state = new Resubmitted($this->travelRequest);
        $this->travelRequest->save();

        $this->logAndDispatch(
            travelRequest: $this->travelRequest,
            action: 'resubmitted',
            fromState: $from,
            toState: 'Resubmitted',
            actedBy: $this->actedBy,
            remarks: $this->remarks,
            returnToState: $this->travelRequest->tr_return_to_state,
            returnToUser: $this->travelRequest->tr_return_to_user,
            notify: $this->notify
        );

        return $this->travelRequest;
    }
}
