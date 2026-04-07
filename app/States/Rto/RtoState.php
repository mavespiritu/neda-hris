<?php

namespace App\States\Rto;

use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

abstract class RtoState extends State
{
    abstract public function label(): string;

    public static function config(): StateConfig
    {
        return parent::config()
            ->default(Draft::class)
            ->allowTransition(Draft::class, Submitted::class, Transitions\SubmitRto::class)
            ->allowTransition(Draft::class, Draft::class, Transitions\SubmitRto::class)
            ->allowTransition(Returned::class, Resubmitted::class, Transitions\ResubmitRto::class)
            ->allowTransition(NeedsRevision::class, Resubmitted::class, Transitions\ResubmitRto::class)
            ->allowTransition(Resubmitted::class, Submitted::class, Transitions\ResumeToReturnTarget::class)
            ->allowTransition(Resubmitted::class, Endorsed::class, Transitions\ResumeToReturnTarget::class)
            ->allowTransition(Resubmitted::class, Approved::class, Transitions\ResumeToReturnTarget::class)
            ->allowTransition(Resubmitted::class, Disapproved::class, Transitions\ResumeToReturnTarget::class)
            ->allowTransition(Submitted::class, Endorsed::class, Transitions\EndorseRto::class)
            ->allowTransition(Submitted::class, Approved::class, Transitions\ApproveRto::class)
            ->allowTransition(Submitted::class, Disapproved::class, Transitions\DisapproveRto::class)
            ->allowTransition(Submitted::class, Returned::class, Transitions\ReturnRto::class)
            ->allowTransition(Submitted::class, NeedsRevision::class, Transitions\ReturnRto::class)
            ->allowTransition(Endorsed::class, Approved::class, Transitions\ApproveRto::class)
            ->allowTransition(Endorsed::class, Disapproved::class, Transitions\DisapproveRto::class)
            ->allowTransition(Endorsed::class, Returned::class, Transitions\ReturnRto::class)
            ->allowTransition(Endorsed::class, NeedsRevision::class, Transitions\ReturnRto::class)
            ->allowTransition(Approved::class, Returned::class, Transitions\ReturnRto::class)
            ->allowTransition(Approved::class, NeedsRevision::class, Transitions\ReturnRto::class)
            ->allowTransition(Disapproved::class, Returned::class, Transitions\ReturnRto::class)
            ->allowTransition(Disapproved::class, NeedsRevision::class, Transitions\ReturnRto::class);
    }
}
