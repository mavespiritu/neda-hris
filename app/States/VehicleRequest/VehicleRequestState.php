<?php 
namespace App\States\VehicleRequest;

use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

abstract class VehicleRequestState extends State
{
  abstract public function label(): string;

  public static function config(): StateConfig
  {
    return parent::config()
      ->default(Draft::class)
      ->allowTransition(Draft::class, Submitted::class, Transitions\SubmitVehicleRequest::class)
      ->allowTransition(Submitted::class, Endorsed::class, Transitions\EndorseVehicleRequest::class)
      //->allowTransition(Endorsed::class, Approved::class, Transitions\ApproveVehicleRequest::class)
      ->allowTransition(Endorsed::class, Reviewed::class, Transitions\ReviewVehicleRequest::class)
      //->allowTransition(Approved::class, Reviewed::class, Transitions\ReviewVehicleRequest::class)
      ->allowTransition(Reviewed::class, Approved::class, Transitions\ApproveVehicleRequest::class)

      // return from multiple steps:
      ->allowTransition(Submitted::class, Returned::class, Transitions\ReturnVehicleRequest::class)
      ->allowTransition(Endorsed::class, Returned::class, Transitions\ReturnVehicleRequest::class)
      ->allowTransition(Reviewed::class, Returned::class, Transitions\ReturnVehicleRequest::class)
      ->allowTransition(Approved::class, Returned::class, Transitions\ReturnVehicleRequest::class)
      //->allowTransition(VehicleAuthorized::class, Returned::class, Transitions\ReturnVehicleRequest::class)

      // resubmit goes to whoever returned it
      ->allowTransition(Returned::class, Resubmitted::class, Transitions\ResubmitVehicleRequest::class)

      // after resubmitted, jump back to where it was returned-from
      ->allowTransition(Resubmitted::class, Submitted::class, Transitions\ResumeToReturnTarget::class)
      ->allowTransition(Resubmitted::class, Endorsed::class, Transitions\ResumeToReturnTarget::class)
      ->allowTransition(Resubmitted::class, Reviewed::class, Transitions\ResumeToReturnTarget::class)
      ->allowTransition(Resubmitted::class, Approved::class, Transitions\ResumeToReturnTarget::class);
  }
}
