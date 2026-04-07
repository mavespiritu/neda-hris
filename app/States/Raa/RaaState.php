<?php

namespace App\States\Raa;

use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

abstract class RaaState extends State
{
    abstract public function label(): string;

    public static function config(): StateConfig
    {
        return parent::config()
            ->default(Draft::class)
            ->allowTransition(Draft::class, Submitted::class, Transitions\SubmitRaa::class)
            ->allowTransition(Draft::class, Draft::class, Transitions\SubmitRaa::class)
            ->allowTransition(Returned::class, Resubmitted::class, Transitions\ResubmitRaa::class)
            ->allowTransition(NeedsRevision::class, Resubmitted::class, Transitions\ResubmitRaa::class)
            ->allowTransition(Resubmitted::class, Submitted::class, Transitions\ResumeToReturnTarget::class)
            ->allowTransition(Resubmitted::class, Endorsed::class, Transitions\ResumeToReturnTarget::class)
            ->allowTransition(Resubmitted::class, Approved::class, Transitions\ResumeToReturnTarget::class)
            ->allowTransition(Resubmitted::class, Disapproved::class, Transitions\ResumeToReturnTarget::class)
            ->allowTransition(Submitted::class, Endorsed::class, Transitions\EndorseRaa::class)
            ->allowTransition(Submitted::class, Approved::class, Transitions\ApproveRaa::class)
            ->allowTransition(Submitted::class, Disapproved::class, Transitions\DisapproveRaa::class)
            ->allowTransition(Submitted::class, Returned::class, Transitions\ReturnRaa::class)
            ->allowTransition(Submitted::class, NeedsRevision::class, Transitions\ReturnRaa::class)
            ->allowTransition(Endorsed::class, Approved::class, Transitions\ApproveRaa::class)
            ->allowTransition(Endorsed::class, Disapproved::class, Transitions\DisapproveRaa::class)
            ->allowTransition(Endorsed::class, Returned::class, Transitions\ReturnRaa::class)
            ->allowTransition(Endorsed::class, NeedsRevision::class, Transitions\ReturnRaa::class)
            ->allowTransition(Approved::class, Returned::class, Transitions\ReturnRaa::class)
            ->allowTransition(Approved::class, NeedsRevision::class, Transitions\ReturnRaa::class)
            ->allowTransition(Disapproved::class, Returned::class, Transitions\ReturnRaa::class)
            ->allowTransition(Disapproved::class, NeedsRevision::class, Transitions\ReturnRaa::class);
    }
}
