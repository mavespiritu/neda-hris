<?php

namespace App\Actions\VehicleRequests;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\Resubmitted as VrResubmitted;
use App\States\VehicleRequest\Returned as VrReturned;
use App\States\VehicleRequest\Submitted as VrSubmitted;
use App\States\VehicleRequest\Endorsed as VrEndorsed;
use App\States\VehicleRequest\Approved as VrApproved;
use App\States\VehicleRequest\Reviewed as VrReviewed;
use App\States\VehicleRequest\VehicleAuthorized as VrAuthorized;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class ResubmitVehicleRequest
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return Gate::forUser($request->user())->allows('vr.resubmit', $id);
    }

    public function rules(): array
    {
        return [];
    }

    public function handle(int $id, string $actedBy): void
    {
        DB::connection('mysql2')->transaction(function () use ($id, $actedBy) {
            $vehicleRequest = VehicleRequest::on('mysql2')
                ->whereKey($id)
                ->lockForUpdate()
                ->first();

            if (! $vehicleRequest) {
                throw new RuntimeException('Vehicle request record not found.');
            }

            if (! ($vehicleRequest->state instanceof VrReturned)) {
                throw new RuntimeException('Only Returned vehicle requests can be resubmitted.');
            }

            $targetLabel = trim((string) $vehicleRequest->vr_return_to_state);
            $returnToUser = trim((string) $vehicleRequest->vr_return_to_user);

            if ($targetLabel === '' || $returnToUser === '') {
                throw new RuntimeException('Return target is missing. Cannot resubmit.');
            }

            $targetClass = $this->targetStateClass($targetLabel);

            // Returned -> Resubmitted
            $vehicleRequest->state->transitionTo(VrResubmitted::class, $actedBy);
            $vehicleRequest->refresh();

            // Resubmitted -> original target
            $vehicleRequest->state->transitionTo($targetClass, $actedBy);
            $vehicleRequest->refresh();

            // optional cleanup
            $vehicleRequest->vr_status_remarks = null;
            $vehicleRequest->vr_return_to_user = null;
            $vehicleRequest->save();
        });
    }

    public function asController(ActionRequest $request)
    {
        $id = (int) $request->route('id');

        try {
            $this->handle($id, (string) $request->user()->ipms_id);

            return back()->with([
                'status' => 'success',
                'title' => 'Resubmitted',
                'message' => 'Vehicle request resubmitted successfully.',
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['vehicle_request' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error("ResubmitVehicleRequest failed [VR:{$id}] {$e->getMessage()}");

            return back()->withErrors([
                'vehicle_request' => 'Failed to resubmit vehicle request.',
            ]);
        }
    }

    private function targetStateClass(string $label): string
    {
        return match ($label) {
            'Submitted' => VrSubmitted::class,
            'Endorsed' => VrEndorsed::class,
            'Approved' => VrApproved::class,
            'Reviewed' => VrReviewed::class,
            'Vehicle Authorized' => VrAuthorized::class,
            default => throw new RuntimeException("Invalid return target state: {$label}"),
        };
    }
}
