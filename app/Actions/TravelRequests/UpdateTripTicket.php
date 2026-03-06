<?php

namespace App\Actions\TravelRequests;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class UpdateTripTicket
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $tripTicketId = (int) $request->route('id');

        $vehicleRequestId = (int) DB::connection('mysql2')
            ->table('trip_tickets')
            ->where('id', $tripTicketId)
            ->value('travel_order_id');

        if (! $vehicleRequestId) return false;

        return Gate::forUser($request->user())->allows('tt.editByVehicleRequest', $vehicleRequestId);
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

    public function handle(int $tripTicketId, array $data, string $actorIpmsId): void
    {
        $conn2 = DB::connection('mysql2');

        $conn2->transaction(function () use ($conn2, $tripTicketId, $data, $actorIpmsId) {
            $ticket = $conn2->table('trip_tickets')
                ->where('id', $tripTicketId)
                ->first();

            if (! $ticket) {
                throw new RuntimeException('Trip ticket not found.');
            }

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

            $duplicateRef = $conn2->table('trip_tickets')
                ->where('reference_no', (string) $data['reference_no'])
                ->where('id', '!=', $tripTicketId)
                ->exists();

            if ($duplicateRef) {
                throw new RuntimeException('Reference number already exists.');
            }

            $conn2->table('trip_tickets')
                ->where('id', $tripTicketId)
                ->update([
                    'travel_order_id' => (int) $data['travel_order_id'],
                    'reference_no' => (string) $data['reference_no'],
                    'vehicle_id' => (int) $data['vehicle_id'],
                    'driver_id' => (string) $data['driver_id'],
                    'dispatcher_id' => (string) $data['dispatcher_id'],
                    'prexc' => $data['prexc'] ?? null,
                    'remarks' => $data['remarks'] ?? null,
                    'updated_by' => $actorIpmsId,
                    'updated_at' => now(),
                ]);

            $this->ensureTripTicketDestinations(
                conn2: $conn2,
                travelOrderId: (int) $data['travel_order_id'],
                tripTicketId: $tripTicketId
            );
        });
    }

    public function asController(ActionRequest $request)
    {
        $tripTicketId = (int) $request->route('id');

        try {
            $this->handle(
                tripTicketId: $tripTicketId,
                data: $request->validated(),
                actorIpmsId: (string) $request->user()->ipms_id
            );

            return back()->with([
                'status' => 'success',
                'title' => 'Updated',
                'message' => 'Trip ticket updated successfully.',
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['trip_ticket' => $e->getMessage()])->withInput();
        } catch (\Throwable $e) {
            Log::error("UpdateTripTicket failed [TT:{$tripTicketId}] {$e->getMessage()}");
            return back()->withErrors(['trip_ticket' => 'Failed to update trip ticket.'])->withInput();
        }
    }

    private function ensureTripTicketDestinations($conn2, int $travelOrderId, int $tripTicketId): void
    {
        $exists = $conn2->table('trip_ticket_destinations')
            ->where('trip_ticket_id', $tripTicketId)
            ->exists();

        if ($exists) {
            return;
        }

        $this->copyTravelOrderDestinationsToTripTicket($conn2, $travelOrderId, $tripTicketId);
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
