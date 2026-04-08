<?php

namespace App\States\Opcr\Transitions;

use App\Models\OpcrRecord;
use App\States\Opcr\Draft;
use Spatie\ModelStates\Transition;

class InitializeOpcrRecord extends Transition
{
    public function __construct(
        public OpcrRecord $opcrRecord,
        public string $actedBy,
        public ?string $remarks = null,
        public bool $notify = false
    ) {
    }

    public function handle(): OpcrRecord
    {
        $this->opcrRecord->state = new Draft($this->opcrRecord);
        $this->opcrRecord->state_remarks = $this->remarks;
        $this->opcrRecord->save();

        return $this->opcrRecord;
    }
}
