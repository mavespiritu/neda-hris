<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VehicleRequestStateChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $vehicleRequestId,
        public string $action,
        public string $fromState,   
        public string $toState,   
        public string $actedBy,     
        public ?string $remarks = null,
        public ?string $returnToState = null,
        public ?string $returnToUser = null,
    ) {}
}