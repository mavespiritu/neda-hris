<?php

namespace App\Actions\VehicleRequests;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\Approved as VrApproved;
use App\States\VehicleRequest\Draft as VrDraft;
use App\States\VehicleRequest\Endorsed as VrEndorsed;
use App\States\VehicleRequest\Submitted as VrSubmitted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class SubmitVehicleRequest
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return Gate::forUser($request->user())->allows('vr.submit', $id);
    }

    public function handle(int|string $travelOrderId, string $actorIpmsId): void
    {
        $conn2 = DB::connection('mysql2');

        $travelOrder = $conn2->table('travel_order')
            ->select(['id', 'division', 'created_by'])
            ->where('id', (int) $travelOrderId)
            ->first();

        if (! $travelOrder) {
            throw new RuntimeException('Travel order not found.');
        }

        $vehicleRequest = VehicleRequest::query()
            ->whereKey((int) $travelOrder->id)
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
            true//! ($isCreatorApprover || $isCreatorRecommender)
        );

        /* if ($isCreatorApprover) {
            $this->transitionIf($vehicleRequest, VrSubmitted::class, VrEndorsed::class, $actorIpmsId, false);
            $this->transitionIf($vehicleRequest, VrEndorsed::class, VrApproved::class, $actorIpmsId, true);
            return;
        }

        if ($isCreatorRecommender) {
            $this->transitionIf($vehicleRequest, VrSubmitted::class, VrEndorsed::class, $actorIpmsId, false);
        } */
    }

    public function asController(ActionRequest $request)
    {
        $id = (int) $request->route('id');

        try {
            $this->handle($id, (string) $request->user()->ipms_id);

            return back()->with([
                'status' => 'success',
                'title' => 'Submitted',
                'message' => 'Vehicle request submitted successfully.',
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['vehicle_request' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error("SubmitVehicleRequest failed [VR:{$id}] {$e->getMessage()}");
            return back()->withErrors(['vehicle_request' => 'Failed to submit vehicle request.']);
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
