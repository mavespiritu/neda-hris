<?php

namespace App\States\TravelRequest\Transitions;

use App\Events\TravelRequestStateChanged;
use App\Models\TravelRequest;
use Illuminate\Support\Facades\DB;

trait LogsTravelRequestHistory
{
    protected function logHistory(
        int $travelRequestId,
        string $status,
        string $actedBy,
        ?string $remarks = null
    ): void {
        DB::connection('mysql2')
            ->table('submission_history')
            ->insert([
                'model' => 'TO',
                'model_id' => $travelRequestId,
                'status' => $status,
                'acted_by' => $actedBy,
                'date_acted' => now(),
                'remarks' => $remarks,
            ]);
    }

    protected function logAndDispatch(
        TravelRequest $travelRequest,
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
            travelRequestId: (int) $travelRequest->id,
            status: $toState,
            actedBy: $actedBy,
            remarks: $remarks
        );

        if (! $notify) {
            return;
        }

        event(new TravelRequestStateChanged(
            travelRequestId: (int) $travelRequest->id,
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
