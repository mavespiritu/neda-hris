<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TravelRequestStateChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $travelRequestId,
        public string $action,
        public string $fromState,   
        public string $toState,   
        public string $actedBy,     
        public ?string $remarks = null,
        public ?string $returnToState = null,
        public ?string $returnToUser = null,
    ) {}
}