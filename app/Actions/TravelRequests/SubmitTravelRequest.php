<?php

namespace App\Actions\TravelRequests;

use App\Models\TravelRequest;
use App\Actions\VehicleRequests\SubmitVehicleRequest;
use App\States\TravelRequest\Draft;
use App\States\TravelRequest\Submitted;
use Illuminate\Support\Facades\DB;

use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use App\Traits\AuthorizesTravelRequests;
use RuntimeException;

class SubmitTravelRequest
{
    use AsAction, AuthorizesTravelRequests;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return $this->canSubmitTravelRequest($request->user(), $id);
    }

    public function handle(int $id, string $actorIpmsId): void
    {
        $conn2 = DB::connection('mysql2');

        $conn2->transaction(function () use ($conn2, $id, $actorIpmsId) {
            $travelRequest = TravelRequest::query()
                ->whereKey($id)
                ->lockForUpdate()
                ->first();

            if (! $travelRequest) {
                throw new RuntimeException('Travel request not found.');
            }

            $this->transitionIf(
                $travelRequest,
                Draft::class,
                Submitted::class,
                $actorIpmsId,
                true
            );

            if ($this->needsVehicle($travelRequest->isRequestingVehicle ?? null)) {
                SubmitVehicleRequest::run(
                    travelOrderId: $travelRequest->id,
                    actorIpmsId: $actorIpmsId
                );
            }
        });
    }

    private function needsVehicle($value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) === true
            || (string) $value === '1'
            || (int) $value === 1;
    }

    public function asController(ActionRequest $request)
    {
        $id = (int) $request->route('id');

        try {
            $this->handle(
                id: $id,
                actorIpmsId: (string) $request->user()->ipms_id
            );

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Submitted',
                'message' => 'Travel request submitted successfully.',
            ]);
        } catch (RuntimeException $e) {
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Not Found',
                'message' => $e->getMessage(),
            ]);
        } catch (\Throwable $e) {
            Log::error("Error submitting TR #{$id}: {$e->getMessage()}");

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => $e->getMessage(),
            ]);
        }
    }

    private function transitionIf(
        TravelRequest $travelRequest,
        string $fromState,
        string $toState,
        string $actorIpmsId,
        bool $notify = true
    ): void {
        if (! ($travelRequest->state instanceof $fromState)) {
            return;
        }

        $travelRequest->state->transitionTo($toState, $actorIpmsId, null, $notify);
        $travelRequest->refresh();
    }
}

