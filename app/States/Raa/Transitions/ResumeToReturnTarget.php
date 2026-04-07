<?php

namespace App\States\Raa\Transitions;

use App\Models\Raa;
use App\States\Raa\{Approved, Disapproved, Endorsed, Submitted};
use InvalidArgumentException;
use Spatie\ModelStates\Transition;

class ResumeToReturnTarget extends Transition
{
    use LogsRaaHistory;

    public function __construct(
        public Raa $raa,
        public string $actedBy
    ) {}

    public function handle(): Raa
    {
        $target = trim((string) $this->raa->raa_return_to_state);

        $map = [
            'Submitted' => Submitted::class,
            'Endorsed' => Endorsed::class,
            'Approved' => Approved::class,
            'Disapproved' => Disapproved::class,
        ];

        if (! isset($map[$target])) {
            throw new InvalidArgumentException("Invalid return target state: {$target}");
        }

        $this->raa->raa_state = new ($map[$target])($this->raa);
        $this->raa->raa_return_to_state = null;
        $this->raa->raa_return_to_user = null;
        $this->raa->raa_status_remarks = null;
        $this->raa->save();

        $this->logHistory($this->raa->id, "Returned to {$target}", $this->actedBy);

        return $this->raa;
    }
}
