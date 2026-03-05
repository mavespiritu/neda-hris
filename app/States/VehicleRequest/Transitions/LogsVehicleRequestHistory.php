<?php

namespace App\States\VehicleRequest\Transitions;

use App\Events\VehicleRequestStateChanged;
use App\Models\VehicleRequest;
use Illuminate\Support\Facades\DB;

trait LogsVehicleRequestHistory
{
    protected function logHistory(
        int $vehicleRequestId,
        string $status,
        string $actedBy,
        ?string $remarks = null
    ): void {
        DB::connection('mysql2')
            ->table('submission_history')
            ->insert([
                'model' => 'Vehicle Request',
                'model_id' => $vehicleRequestId,
                'status' => $status,
                'acted_by' => $actedBy,
                'date_acted' => now(),
                'remarks' => $remarks,
            ]);
    }

    protected function logAndDispatch(
        VehicleRequest $vehicleRequest,
        string $action,
        string $fromState,
        string $toState,
        string $actedBy,
        ?string $remarks = null,
        ?string $returnToState = null,
        ?string $returnToUser = null,
        bool $notify = true
    ): void {
        $this->logHistory(
            vehicleRequestId: (int) $vehicleRequest->id,
            status: $toState,
            actedBy: $actedBy,
            remarks: $remarks
        );

        if (! $notify) {
            return;
        }

        event(new VehicleRequestStateChanged(
            vehicleRequestId: (int) $vehicleRequest->id,
            action: $action,
            fromState: $fromState,
            toState: $toState,
            actedBy: $actedBy,
            remarks: $remarks,
            returnToState: $returnToState,
            returnToUser: $returnToUser
        ));
    }
}
