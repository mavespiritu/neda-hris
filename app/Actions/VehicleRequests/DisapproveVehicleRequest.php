<?php

namespace App\Actions\VehicleRequests;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\Disapproved as VrDisapproved;
use App\States\VehicleRequest\Submitted as VrSubmitted;
use App\States\VehicleRequest\Endorsed as VrEndorsed;
use App\States\VehicleRequest\Approved as VrApproved;
use App\States\VehicleRequest\Reviewed as VrReviewed;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class DisapproveVehicleRequest
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return Gate::forUser($request->user())->allows('vr.disapprove', $id);
    }

    public function rules(): array
    {
        return [];
    }

    public function handle(int $id, string $actedBy): void
    {
        DB::connection('mysql2')->transaction(function () use ($id, $actedBy) {
            $vr = VehicleRequest::on('mysql2')->whereKey($id)->lockForUpdate()->first();

            if (! $vr) throw new RuntimeException('Vehicle request not found.');

            $allowedFrom = [
                VrSubmitted::class,
                VrEndorsed::class,
                VrApproved::class,
                VrReviewed::class,
            ];

            $fromClass = get_class($vr->state);
            if (! in_array($fromClass, $allowedFrom, true)) {
                throw new RuntimeException('This request cannot be disapproved at its current status.');
            }

            $vr->state->transitionTo(VrDisapproved::class, $actedBy);
        });
    }

    public function asController(ActionRequest $request)
    {
        $id = (int) $request->route('id');

        try {
            $this->handle($id, (string) $request->user()->ipms_id);

            return back()->with([
                'status' => 'success',
                'title' => 'Disapproved',
                'message' => 'Vehicle request disapproved successfully.',
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['vehicle_request' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error("DisapproveVehicleRequest failed [VR:{$id}] {$e->getMessage()}");
            return back()->withErrors(['vehicle_request' => 'Failed to disapprove vehicle request.']);
        }
    }
}
