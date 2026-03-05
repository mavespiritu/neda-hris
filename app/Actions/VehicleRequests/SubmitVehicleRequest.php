<?php

namespace App\Actions\VehicleRequests;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\Approved as VrApproved;
use App\States\VehicleRequest\Draft as VrDraft;
use App\States\VehicleRequest\Endorsed as VrEndorsed;
use App\States\VehicleRequest\Submitted as VrSubmitted;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class SubmitVehicleRequest
{
    use AsAction;

    public function handle(object $travelOrder, string $actorIpmsId): void
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $travelOrderId = (int) $travelOrder->id;

        $vehicleRequest = VehicleRequest::query()
            ->whereKey($travelOrderId)
            ->lockForUpdate()
            ->first();

        if (! $vehicleRequest) {
            throw new RuntimeException('Vehicle request record not found.');
        }

        $approverId = $conn2->table('travel_order_signatories')
            ->where('type', 'Approver_VR')
            ->when($travelOrder->division, fn ($q) => $q->where('division', $travelOrder->division))
            ->value('signatory');

        $recommenderId = $conn2->table('travel_order_signatories')
            ->where('type', 'Recommending_VR')
            ->when($travelOrder->division, fn ($q) => $q->where('division', $travelOrder->division))
            ->value('signatory');

        $creatorId = (string) $travelOrder->created_by;

        if ($vehicleRequest->getRawOriginal('state') === null || $vehicleRequest->getRawOriginal('state') === '') {
            $vehicleRequest->state = VrDraft::class;
            $vehicleRequest->save();
        }

        $isCreatorApprover = $approverId && $creatorId === (string) $approverId;
        $isCreatorRecommender = $recommenderId && $creatorId === (string) $recommenderId;

        $this->transitionIf(
            $vehicleRequest,
            VrDraft::class,
            VrSubmitted::class,
            $actorIpmsId,
            !($isCreatorApprover || $isCreatorRecommender)
        );

        if ($isCreatorApprover) {
            $this->transitionIf($vehicleRequest, VrSubmitted::class, VrEndorsed::class, $actorIpmsId, false);
            $this->transitionIf($vehicleRequest, VrEndorsed::class, VrApproved::class, $actorIpmsId, true);
            return;
        }

        if ($isCreatorRecommender) {
            if ($vehicleRequest->state instanceof VrSubmitted) {
                $this->transitionIf($vehicleRequest, VrSubmitted::class, VrEndorsed::class, $actorIpmsId, false);
            }
        }
    }

    private function transitionIf(
        VehicleRequest $vehicleRequest,
        string $fromState,
        string $toState,
        string $actorIpmsId,
        bool $notify = true
    ): void {
        if (! ($vehicleRequest->state instanceof $fromState)) {
            return;
        }

        $vehicleRequest->state->transitionTo($toState, $actorIpmsId, null, $notify);
        $vehicleRequest->refresh();
    }
}
