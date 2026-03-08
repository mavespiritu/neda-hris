<?php

namespace App\States\VehicleRequest\Transitions;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\Endorsed;
use Spatie\ModelStates\Transition;

class EndorseVehicleRequest extends Transition
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

        $this->vehicleRequest->vr_status_remarks = $this->remarks;
        $this->vehicleRequest->vr_state = new Endorsed($this->vehicleRequest);
        $this->vehicleRequest->save();

        $this->logAndDispatch(
            vehicleRequest: $this->vehicleRequest,
            action: 'endorsed',
            fromState: $from,
            toState: 'Endorsed',
            actedBy: $this->actedBy,
            remarks: $this->remarks,
            notify: $this->notify
        );

        return $this->vehicleRequest;
    }
}
