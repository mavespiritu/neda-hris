<?php

namespace App\Actions\VehicleRequests;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\Submitted as VrSubmitted;
use App\States\VehicleRequest\Endorsed as VrEndorsed;
use Illuminate\Support\Facades\DB;
use App\Traits\AuthorizesVehicleRequests;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class EndorseVehicleRequest
{
    use AsAction, AuthorizesVehicleRequests;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return $this->canEndorseVehicleRequest($request->user(), $id);
    }

    public function rules(): array
    {
        return [];
    }

    public function handle(int $id, string $actedBy): void
    {
        DB::connection('mysql2')->transaction(function () use ($id, $actedBy) {
            $vr = VehicleRequest::on('mysql2')->whereKey($id)->lockForUpdate()->first();

            if (! $vr) {
                throw new RuntimeException('Vehicle request not found.');
            }

            if (! ($vr->state instanceof VrSubmitted)) {
                throw new RuntimeException('Only submitted requests can be endorsed.');
            }

            $vr->state->transitionTo(VrEndorsed::class, $actedBy);
        });
    }

    public function asController(ActionRequest $request)
    {
        $id = (int) $request->route('id');

        try {
            $this->handle($id, (string) $request->user()->ipms_id);

            return back()->with([
                'status' => 'success',
                'title' => 'Endorsed',
                'message' => 'Vehicle request endorsed successfully.',
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['vehicle_request' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error("EndorseVehicleRequest failed [VR:{$id}] {$e->getMessage()}");
            return back()->withErrors(['vehicle_request' => 'Failed to endorse vehicle request.']);
        }
    }
}


