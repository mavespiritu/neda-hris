<?php

namespace App\States\VehicleRequest\Transitions;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\{Submitted, Endorsed, Approved, Reviewed, VehicleAuthorized};
use Spatie\ModelStates\Transition;
use InvalidArgumentException;

class ResumeToReturnTarget extends Transition
{
  use LogsVehicleRequestHistory;

  public function __construct(
    public VehicleRequest $vehicleRequest,
    public string $actedBy
  ) {}

  public function handle(): VehicleRequest
  {
    $target = trim((string) $this->vehicleRequest->vr_return_to_state);

    $map = [
      'Submitted' => Submitted::class,
      'Endorsed'  => Endorsed::class,
      'Approved'  => Approved::class,
      'Reviewed'  => Reviewed::class,
      'Vehicle Authorized'  => VehicleAuthorized::class,
    ];

    if (!isset($map[$target])) {
      throw new InvalidArgumentException("Invalid return target state: {$target}");
    }

    $this->vehicleRequest->vr_state = new ($map[$target])($this->vehicleRequest);

    // clear return memory after jumping back
    $this->vehicleRequest->vr_return_to_state = null;

    $this->vehicleRequest->save();

    $this->logHistory($this->vehicleRequest->id, "Returned to {$target}", $this->actedBy);

    return $this->vehicleRequest;
  }
}
