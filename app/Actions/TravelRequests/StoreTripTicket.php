<?php

namespace App\Actions\TravelRequests;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use App\Models\TravelRequest;
use App\States\TravelRequest\Draft;
use App\States\TravelRequest\Submitted;
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

            $this->createDriverTravelRequestFromOriginal(
                conn2: $conn2,
                originalTravelOrderId: (int) $data['travel_order_id'],
                driverId: (string) $data['driver_id'],
                actorIpmsId: $actorIpmsId
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

    private function createDriverTravelRequestFromOriginal($conn2, int $originalTravelOrderId, string $driverId, string $actorIpmsId): int
    {
        $original = $conn2->table('travel_order')
            ->where('id', $originalTravelOrderId)
            ->first();

        if (! $original) {
            throw new RuntimeException('Original travel request not found for driver copy.');
        }

        $driverDivision = DB::connection('mysql3')->table('tblemployee')->where('emp_id', $driverId)->value('division_id');

        $newCategory = $conn2->table('travel_order_categories')->where('title', 'Driving Services')->value('id');

        $newRecommending = $conn2->table('travel_order_signatories')
            ->where('type', 'Recommending_Staff_TO')
            ->where('division', $driverDivision)
            ->value('signatory');

        $newApproving = $conn2->table('travel_order_signatories')
            ->where('type', 'Approver_TO')
            ->value('signatory');

        // simple unique reference (adjust if you have your own generator)
        $newReferenceNo = $this->nextReferenceNo($conn2);

        $newTravelOrderId = (int) $conn2->table('travel_order')->insertGetId([
            'reference_no' => $newReferenceNo,
            'request_type' => $original->request_type,
            'travel_type' => $original->travel_type,
            'travel_category_id' => $newCategory ?? $original->travel_category_id,
            'start_date' => $original->start_date,
            'end_date' => $original->end_date,
            'purpose' => 'To provide driving services to Travel Request No. '.$original->reference_no,
            'fund_source_id' => $original->fund_source_id,
            'other_passengers' => $original->other_passengers,
            'other_vehicles' => $original->other_vehicles,
            'other_drivers' => $original->other_drivers,
            'isRequestingVehicle' => 0,
            'est_distance' => $original->est_distance,
            'est_departure_time' => $original->est_departure_time,
            'est_arrival_time' => $original->est_arrival_time,
            'division' => $driverDivision,
            'created_by' => $actorIpmsId,
            'date_created' => now(),
        ]);

        // only selected driver as personnel
        $conn2->table('travel_order_staffs')->insert([
            'travel_order_id' => $newTravelOrderId,
            'emp_id' => $driverId,
            'recommender_id' => $newRecommending ?? null,
            'approver_id' => $newApproving ?? null,
        ]);

        $destinationRows = $conn2->table('travel_order_destinations')
            ->where('travel_order_id', $originalTravelOrderId)
            ->get()
            ->map(fn ($d) => [
                'travel_order_id' => $newTravelOrderId,
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
            ])
            ->all();

        if (! empty($destinationRows)) {
            $conn2->table('travel_order_destinations')->insert($destinationRows);
        }

        $newTravelRequest = TravelRequest::query()
            ->whereKey($newTravelOrderId)
            ->lockForUpdate()
            ->first();

        if (! $newTravelRequest) {
            throw new RuntimeException('Generated travel request not found for state transition.');
        }

        if (blank($newTravelRequest->getRawOriginal('tr_state'))) {
            $newTravelRequest->tr_state = Draft::class;
            $newTravelRequest->save();
            $newTravelRequest->refresh();
        }

        if ($newTravelRequest->state instanceof Draft) {
            $newTravelRequest->state->transitionTo(
                Submitted::class,
                $actorIpmsId,
                'Auto-generated from trip ticket for selected driver.',
                true
            );
            $newTravelRequest->refresh();
        }

        return $newTravelOrderId;
    }

    private function nextReferenceNo($conn2): string
    {
        $year = now()->format('Y');

        $latestRef = $conn2->table('travel_order')
        ->where('request_type', 'TO')
        ->whereRaw('LEFT(reference_no, 4) = ?', [$year])
        ->whereRaw('CHAR_LENGTH(reference_no) = 8')
        ->whereRaw('reference_no REGEXP "^[0-9]{8}$"')
        ->orderByDesc('reference_no')
        ->value('reference_no');

        if (!$latestRef) return $year . '0001';

        $counter = (int) substr((string) $latestRef, 4);
        return $year . str_pad((string) ($counter + 1), 4, '0', STR_PAD_LEFT);
    }

}
