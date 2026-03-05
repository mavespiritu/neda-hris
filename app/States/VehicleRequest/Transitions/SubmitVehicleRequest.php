<?php

namespace App\States\VehicleRequest\Transitions;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\Submitted;
use Spatie\ModelStates\Transition;

class SubmitVehicleRequest extends Transition
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
        $this->vehicleRequest->state = new Submitted($this->vehicleRequest);
        $this->vehicleRequest->save();

        $this->logAndDispatch(
            vehicleRequest: $this->vehicleRequest,
            action: 'submitted',
            fromState: $from,
            toState: 'Submitted',
            actedBy: $this->actedBy,
            remarks: $this->remarks,
            notify: $this->notify
        );

        return $this->vehicleRequest;
    }
}
