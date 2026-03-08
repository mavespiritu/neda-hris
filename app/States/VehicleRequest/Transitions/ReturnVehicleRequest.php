<?php

namespace App\States\VehicleRequest\Transitions;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\Returned;
use Spatie\ModelStates\Transition;
use InvalidArgumentException;

class ReturnVehicleRequest extends Transition
{
    use LogsVehicleRequestHistory;

    public function __construct(
        public VehicleRequest $vehicleRequest,
        public string $actedBy,
        public string $returnToState,
        public string $returnToUser,
        public ?string $remarks = null,
        public bool $notify = true
    ) {}

    public function handle(): VehicleRequest
    {
        $from = $this->vehicleRequest->state->label();

        $returnToState = trim($this->returnToState);
        $returnToUser = trim($this->returnToUser);

        if ($returnToState === '' || $returnToUser === '') {
            throw new InvalidArgumentException('returnToState and returnToUser are required.');
        }

        $this->vehicleRequest->vr_return_to_state = $returnToState;
        $this->vehicleRequest->vr_return_to_user = $returnToUser;
        $this->vehicleRequest->vr_status_remarks = $this->remarks;

        $this->vehicleRequest->state = new Returned($this->vehicleRequest);
        $this->vehicleRequest->save();

        $this->logAndDispatch(
            vehicleRequest: $this->vehicleRequest,
            action: 'returned',
            fromState: $from,
            toState: 'Returned',
            actedBy: $this->actedBy,
            remarks: $this->remarks,
            returnToState: $returnToState,
            returnToUser: $returnToUser,
            notify: $this->notify
        );

        return $this->vehicleRequest;
    }
}
