<?php

namespace App\Actions\VehicleRequests;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\Reviewed as VrReviewed;
use App\States\VehicleRequest\VehicleAuthorized as VrVehicleAuthorized;
use Illuminate\Support\Facades\DB;
use App\Traits\AuthorizesVehicleRequests;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class AuthorizeVehicleRequest
{
    use AsAction, AuthorizesVehicleRequests;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return $this->canAuthorizeVehicleRequest($request->user(), $id);
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
            if (! ($vr->state instanceof VrReviewed)) {
                throw new RuntimeException('Only reviewed requests can be authorized.');
            }

            $vr->state->transitionTo(VrVehicleAuthorized::class, $actedBy);
        });
    }

    public function asController(ActionRequest $request)
    {
        $id = (int) $request->route('id');

        try {
            $this->handle($id, (string) $request->user()->ipms_id);

            return back()->with([
                'status' => 'success',
                'title' => 'Authorized',
                'message' => 'Vehicle request authorized successfully.',
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['vehicle_request' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error("AuthorizeVehicleRequest failed [VR:{$id}] {$e->getMessage()}");
            return back()->withErrors(['vehicle_request' => 'Failed to authorize vehicle request.']);
        }
    }
}


