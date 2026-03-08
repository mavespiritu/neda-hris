<?php

namespace App\States\VehicleRequest\Transitions;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\Disapproved;
use Spatie\ModelStates\Transition;

class DisapproveVehicleRequest extends Transition
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
    $this->vehicleRequest->vr_state = new Disapproved($this->vehicleRequest);
    $this->vehicleRequest->save();

    $this->logAndDispatch(
        vehicleRequest: $this->vehicleRequest,
        action: 'disapproved',
        fromState: $from,
        toState: 'Disapproved',
        actedBy: $this->actedBy,
        remarks: $this->remarks,
        notify: $this->notify
    );

    return $this->vehicleRequest;
  }
}
