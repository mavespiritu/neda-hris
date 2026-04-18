<?php

namespace App\Actions\VehicleRequests;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\Approved as VrApproved;
use App\States\VehicleRequest\Endorsed as VrEndorsed;
use App\States\VehicleRequest\Reviewed as VrReviewed;
use App\States\VehicleRequest\Returned as VrReturned;
use App\States\VehicleRequest\Submitted as VrSubmitted;
use App\States\VehicleRequest\VehicleAuthorized as VrAuthorized;
use Illuminate\Support\Facades\DB;
use App\Traits\AuthorizesVehicleRequests;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class ReturnVehicleRequest
{
    use AsAction, AuthorizesVehicleRequests;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return $this->canReturnVehicleRequest($request->user(), $id);
    }

    public function rules(): array
    {
        return [
            'remarks' => ['required', 'string'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'remarks.required' => 'Remarks is required when returning a vehicle request.',
        ];
    }

    public function handle(int $id, string $actedBy, string $remarks): void
    {
        $conn2 = DB::connection('mysql2');

        $conn2->transaction(function () use ($conn2, $id, $actedBy, $remarks) {
            $travelOrder = $conn2->table('travel_order')
                ->where('id', $id)
                ->lockForUpdate()
                ->first();

            if (! $travelOrder) {
                throw new RuntimeException('Travel order record not found.');
            }

            $vehicleRequest = VehicleRequest::on('mysql2')
                ->whereKey($id)
                ->lockForUpdate()
                ->first();

            if (! $vehicleRequest) {
                throw new RuntimeException('Vehicle request record not found.');
            }

            $isReturnable =
                $vehicleRequest->state instanceof VrSubmitted ||
                $vehicleRequest->state instanceof VrEndorsed ||
                $vehicleRequest->state instanceof VrApproved ||
                $vehicleRequest->state instanceof VrReviewed ||
                $vehicleRequest->state instanceof VrAuthorized;

            if (! $isReturnable) {
                throw new RuntimeException('Current vehicle request status cannot be returned.');
            }

            $returnToState = $vehicleRequest->state->label();
            $returnToUser = (string) $travelOrder->created_by;

            $vehicleRequest->state->transitionTo(
                VrReturned::class,
                $actedBy,
                $returnToState,
                $returnToUser,
                $remarks,
                true
            );

            $vehicleRequest->refresh();
        });
    }

    public function asController(ActionRequest $request)
    {
        $id = (int) $request->route('id');

        try {
            $this->handle(
                id: $id,
                actedBy: (string) $request->user()->ipms_id,
                remarks: (string) $request->validated('remarks')
            );

            return back()->with([
                'status' => 'success',
                'title' => 'Returned',
                'message' => 'Vehicle request returned successfully.',
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['remarks' => $e->getMessage()])->withInput();
        } catch (\Throwable $e) {
            Log::error("ReturnVehicleRequest failed [VR:{$id}] {$e->getMessage()}");

            return back()->withErrors([
                'remarks' => 'Failed to return vehicle request.',
            ])->withInput();
        }
    }
}


