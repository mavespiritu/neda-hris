<?php

namespace App\States\TravelRequest\Transitions;

use App\Models\TravelRequest;
use App\States\TravelRequest\Submitted;
use Spatie\ModelStates\Transition;

class SubmitTravelRequest extends Transition
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
        $this->travelRequest->tr_state = new Submitted($this->travelRequest);
        $this->travelRequest->save();

        $this->logAndDispatch(
            travelRequest: $this->travelRequest,
            action: 'submitted',
            fromState: $from,
            toState: 'Submitted',
            actedBy: $this->actedBy,
            remarks: $this->remarks,
            notify: $this->notify
        );

        return $this->travelRequest;
    }
}
