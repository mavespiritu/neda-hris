<?php 
namespace App\States\TravelRequest;

use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

abstract class TravelRequestState extends State
{
  abstract public function label(): string;

  public static function config(): StateConfig
  {
    return parent::config()
      ->default(Draft::class)
      ->allowTransition(Draft::class, Draft::class, Transitions\InitializeTravelRequest::class)
      ->allowTransition(Draft::class, Submitted::class, Transitions\SubmitTravelRequest::class)
      // return from multiple steps:
      ->allowTransition(Submitted::class, Returned::class, Transitions\ReturnTravelRequest::class)

      // resubmit goes to whoever returned it
      ->allowTransition(Returned::class, Resubmitted::class, Transitions\ResubmitTravelRequest::class)

      // after resubmitted, jump back to where it was returned-from
      ->allowTransition(Resubmitted::class, Submitted::class, Transitions\ResumeToReturnTarget::class);
  }
}
