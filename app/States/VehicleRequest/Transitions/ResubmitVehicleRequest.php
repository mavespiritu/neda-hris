<?php

namespace App\States\VehicleRequest\Transitions;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\Resubmitted;
use Spatie\ModelStates\Transition;

class ResubmitVehicleRequest extends Transition
{
    use LogsVehicleRequestHistory;

    public function __construct(
        public VehicleRequest $vehicleRequest,
        public string $actedBy,
        public ?string $remarks = null,
        public bool $notify = true
    ) {}

    public function handle(): VehicleRequest
    {
        $from = $this->vehicleRequest->state->label();

        $this->vehicleRequest->status_remarks = $this->remarks;
        $this->vehicleRequest->state = new Resubmitted($this->vehicleRequest);
        $this->vehicleRequest->save();

        $this->logAndDispatch(
            vehicleRequest: $this->vehicleRequest,
            action: 'resubmitted',
            fromState: $from,
            toState: 'Resubmitted',
            actedBy: $this->actedBy,
            remarks: $this->remarks,
            returnToState: $this->vehicleRequest->return_to_state,
            returnToUser: $this->vehicleRequest->return_to_user,
            notify: $this->notify
        );

        return $this->vehicleRequest;
    }
}
