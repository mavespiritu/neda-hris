<?php

namespace App\Actions\TravelRequests;

use App\Actions\VehicleRequests\SubmitVehicleRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class SubmitTravelRequest
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return Gate::forUser($request->user())->allows('tr.submit', $id);
    }

    public function handle(int $id, string $actorIpmsId): void
    {
        $conn2 = DB::connection('mysql2');

        $conn2->transaction(function () use ($conn2, $id, $actorIpmsId) {
            $travelOrder = $conn2->table('travel_order')
                ->where('id', $id)
                ->lockForUpdate()
                ->first();

            if (! $travelOrder) {
                throw new RuntimeException('Travel order record not found.');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'TO',
                'model_id' => $id,
                'status' => 'Submitted',
                'acted_by' => $actorIpmsId,
                'date_acted' => now(),
            ]);

            if ($this->needsVehicle($travelOrder->isRequestingVehicle ?? null)) {
                SubmitVehicleRequest::run(
                    travelOrder: $travelOrder,
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
            Log::error("Error submitting TO #{$id}: {$e->getMessage()}");

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while submitting TO. Please try again.',
            ]);
        }
    }
}
