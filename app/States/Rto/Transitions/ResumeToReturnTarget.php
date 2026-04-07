<?php

namespace App\States\Rto\Transitions;

use App\Models\Rto;
use App\States\Rto\{Approved, Disapproved, Endorsed, Submitted};
use InvalidArgumentException;
use Spatie\ModelStates\Transition;

class ResumeToReturnTarget extends Transition
{
    use LogsRtoHistory;

    public function __construct(
        public Rto $rto,
        public string $actedBy
    ) {}

    public function handle(): Rto
    {
        $target = trim((string) $this->rto->rto_return_to_state);

        $map = [
            'Submitted' => Submitted::class,
            'Endorsed' => Endorsed::class,
            'Approved' => Approved::class,
            'Disapproved' => Disapproved::class,
        ];

        if (! isset($map[$target])) {
            throw new InvalidArgumentException("Invalid return target state: {$target}");
        }

        $this->rto->rto_state = new ($map[$target])($this->rto);
        $this->rto->rto_return_to_state = null;
        $this->rto->rto_return_to_user = null;
        $this->rto->rto_status_remarks = null;
        $this->rto->save();

        $this->logHistory($this->rto->id, "Returned to {$target}", $this->actedBy);

        return $this->rto;
    }
}
