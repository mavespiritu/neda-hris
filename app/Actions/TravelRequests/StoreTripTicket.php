<?php

namespace App\Actions\TravelRequests;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class StoreTripTicket
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $vehicleRequestId = $request->input('travel_order_id') ?? $request->route('id');

        if (blank($vehicleRequestId)) {
            return Gate::forUser($request->user())->allows('tt.create');
        }

        return Gate::forUser($request->user())
            ->allows('tt.createByVehicleRequest', (int) $vehicleRequestId);
    }

    public function rules(): array
    {
        return [
            'travel_order_id' => ['required', 'integer'],
            'reference_no' => ['required', 'string', 'max:20'],
            'vehicle_id' => ['required', 'integer'],
            'driver_id' => ['required'],
            'dispatcher_id' => ['required'],
            'prexc' => ['nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'travel_order_id.required' => 'Travel request is required.',
            'reference_no.required' => 'Reference number is required.',
            'vehicle_id.required' => 'Vehicle is required.',
            'driver_id.required' => 'Driver is required.',
            'dispatcher_id.required' => 'Dispatcher is required.',
        ];
    }

    public function handle(array $data, string $actorIpmsId): int
    {
        $conn2 = DB::connection('mysql2');

        return $conn2->transaction(function () use ($conn2, $data, $actorIpmsId) {
            $order = $conn2->table('travel_order')
                ->select(['id', 'request_type', 'isRequestingVehicle'])
                ->where('id', (int) $data['travel_order_id'])
                ->first();

            if (! $order) {
                throw new RuntimeException('Travel request not found.');
            }

            $isValidRequestType = ($order->request_type === 'VR')
                || ($order->request_type === 'TO' && (int) $order->isRequestingVehicle === 1);

            if (! $isValidRequestType) {
                throw new RuntimeException('Selected travel request is not valid for trip ticket.');
            }

            $exists = $conn2->table('trip_tickets')
                ->where('reference_no', (string) $data['reference_no'])
                ->exists();

            if ($exists) {
                throw new RuntimeException('Reference number already exists.');
            }

            $tripTicketId = (int) $conn2->table('trip_tickets')->insertGetId([
                'travel_order_id' => (int) $data['travel_order_id'],
                'reference_no' => (string) $data['reference_no'],
                'vehicle_id' => (int) $data['vehicle_id'],
                'driver_id' => (string) $data['driver_id'],
                'dispatcher_id' => (string) $data['dispatcher_id'],
                'prexc' => $data['prexc'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $actorIpmsId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->copyTravelOrderDestinationsToTripTicket(
                conn2: $conn2,
                travelOrderId: (int) $data['travel_order_id'],
                tripTicketId: $tripTicketId
            );

            return $tripTicketId;
        });
    }

    public function asController(ActionRequest $request)
    {
        try {
            $id = $this->handle(
                data: $request->validated(),
                actorIpmsId: (string) $request->user()->ipms_id
            );

            return back()->with([
                'status' => 'success',
                'title' => 'Saved',
                'message' => 'Trip ticket created successfully.',
                'trip_ticket_id' => $id,
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['trip_ticket' => $e->getMessage()])->withInput();
        } catch (\Throwable $e) {
            Log::error("StoreTripTicket failed: {$e->getMessage()}");
            return back()->withErrors(['trip_ticket' => 'Failed to create trip ticket.'])->withInput();
        }
    }

    private function copyTravelOrderDestinationsToTripTicket($conn2, int $travelOrderId, int $tripTicketId): void
    {
        $rows = $conn2->table('travel_order_destinations')
            ->select([
                'type',
                'country',
                'province',
                'provinceName',
                'citymun',
                'citymunName',
                'isMetroManila',
                'district',
                'districtName',
                'location',
            ])
            ->where('travel_order_id', $travelOrderId)
            ->orderBy('id')
            ->get()
            ->map(fn ($d) => [
                'travel_order_id' => $travelOrderId,
                'trip_ticket_id' => $tripTicketId,
                'type' => $d->type,
                'country' => $d->country,
                'province' => $d->province,
                'provinceName' => $d->provinceName,
                'citymun' => $d->citymun,
                'citymunName' => $d->citymunName,
                'isMetroManila' => $d->isMetroManila,
                'district' => $d->district,
                'districtName' => $d->districtName,
                'location' => $d->location,
                'departure_time' => null,
                'arrival_time' => null,
            ])
            ->all();

        if (! empty($rows)) {
            $conn2->table('trip_ticket_destinations')->insert($rows);
        }
    }
}
