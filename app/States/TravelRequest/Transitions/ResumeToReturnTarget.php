<?php

namespace App\States\TravelRequest\Transitions;

use App\Models\TravelRequest;
use App\States\TravelRequest\{Submitted};
use Spatie\ModelStates\Transition;
use InvalidArgumentException;

class ResumeToReturnTarget extends Transition
{
  use LogsTravelRequestHistory;

  public function __construct(
    public TravelRequest $travelRequest,
    public string $actedBy
  ) {}

  public function handle(): TravelRequest
  {
    $target = trim((string) $this->travelRequest->tr_return_to_state);

    $map = [
      'Submitted' => Submitted::class,
    ];

    if (!isset($map[$target])) {
      throw new InvalidArgumentException("Invalid return target state: {$target}");
    }

    $this->travelRequest->tr_state = new ($map[$target])($this->travelRequest);

    // clear return memory after jumping back
    $this->travelRequest->tr_return_to_state = null;

    $this->travelRequest->save();

    $this->logHistory($this->travelRequest->id, "Returned to {$target}", $this->actedBy);

    return $this->travelRequest;
  }
}
