<?php

namespace App\States\TravelRequest\Transitions;

use App\Models\TravelRequest;
use App\States\TravelRequest\Draft;
use Spatie\ModelStates\Transition;

class InitializeTravelRequest extends Transition
{
    use LogsTravelRequestHistory;

    public function __construct(
        public TravelRequest $travelRequest,
        public string $actedBy,
        public ?string $remarks = null,
        public bool $notify = false
    ) {}

    public function handle(): TravelRequest
    {
        $this->travelRequest->tr_state = new Draft($this->travelRequest);
        $this->travelRequest->tr_status_remarks = $this->remarks;
        $this->travelRequest->save();

        $this->logAndDispatch(
            travelRequest: $this->travelRequest,
            action: 'initialized',
            fromState: 'Draft',
            toState: 'Draft',
            actedBy: $this->actedBy,
            remarks: $this->remarks,
            notify: $this->notify
        );

        return $this->travelRequest;
    }
}
