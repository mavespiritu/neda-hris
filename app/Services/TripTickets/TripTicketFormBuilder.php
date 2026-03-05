<?php

namespace App\Services\TripTickets;

use App\Traits\BuildsEmployeeNameMap;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TripTicketFormBuilder
{
    use BuildsEmployeeNameMap;

    public function build(?int $vehicleRequestId = null, ?int $tripTicketId = null, bool $lockTravelRequest = false): array
    {
        $conn2 = DB::connection('mysql2');

        if ($tripTicketId !== null) {
            return $this->editPayload($conn2, $tripTicketId, $lockTravelRequest);
        }

        return $this->createPayload($conn2, $vehicleRequestId, $lockTravelRequest);
    }

    private function createPayload($conn2, ?int $vehicleRequestId = null, bool $lockTravelRequest = false): array
    {
        $requests = $this->requests($conn2);

        $selectedRequest = null;
        if ($vehicleRequestId !== null) {
            $selectedRequest = $requests->firstWhere('value', (int) $vehicleRequestId);
            if (! $selectedRequest) {
                throw new \RuntimeException('Selected travel request is invalid for trip ticket.');
            }
        }

        return [
            'data' => [
                'mode' => 'create',
                'show_travel_request_selector' => ! $lockTravelRequest,
                'travel_order_id' => $selectedRequest['value'] ?? null,
                'requests' => $requests,
                'vehicles' => $this->vehicles($conn2),
                'drivers' => $this->activeEmployeeOptions(),
                'dispatchers' => $this->activeEmployeeOptions(),
                'trip_ticket' => [
                    'id' => null,
                    'travel_order_id' => $selectedRequest['value'] ?? null,
                    'reference_no' => $this->nextReferenceNo($conn2),
                    'vehicle_id' => '',
                    'driver_id' => '',
                    'dispatcher_id' => '',
                    'prexc' => '',
                    'remarks' => '',
                ],
            ],
        ];
    }

    private function editPayload($conn2, int $tripTicketId, bool $lockTravelRequest = false): array
    {
        $ticket = $conn2->table('trip_tickets')
            ->select([
                'id',
                'travel_order_id',
                'reference_no',
                'vehicle_id',
                'driver_id',
                'dispatcher_id',
                'prexc',
                'remarks',
            ])
            ->where('id', $tripTicketId)
            ->first();

        if (! $ticket) {
            throw new \RuntimeException('Trip ticket not found.');
        }

        $order = $this->request($conn2, (int) $ticket->travel_order_id);
        if (! $order) {
            throw new \RuntimeException('Travel request not found.');
        }

        return [
            'data' => [
                'mode' => 'edit',
                'travel_order_id' => (int) $order->id,
                'show_travel_request_selector' => ! $lockTravelRequest,
                'requests' => $this->requests($conn2),
                'vehicles' => $this->vehicles($conn2),
                'drivers' => $this->activeEmployeeOptions(),
                'dispatchers' => $this->activeEmployeeOptions(),
                'trip_ticket' => [
                    'id' => (int) $ticket->id,
                    'travel_order_id' => (int) $ticket->travel_order_id,
                    'reference_no' => $ticket->reference_no,
                    'vehicle_id' => $ticket->vehicle_id ? (int) $ticket->vehicle_id : '',
                    'driver_id' => $ticket->driver_id ? (string) $ticket->driver_id : '',
                    'dispatcher_id' => $ticket->dispatcher_id ? (string) $ticket->dispatcher_id : '',
                    'prexc' => $ticket->prexc ?? '',
                    'remarks' => $ticket->remarks ?? '',
                ],
            ],
        ];
    }

    private function request($conn2, int $requestId): ?object
    {
        return $conn2->table('travel_order')
            ->select(['id', 'reference_no', 'start_date', 'end_date', 'purpose'])
            ->where('id', $requestId)
            ->first();
    }

    private function requests($conn2): Collection
    {
        return $conn2->table('travel_order')
            ->select(['id', 'reference_no', 'purpose'])
            ->where(function ($q) {
                $q->where(function ($qq) {
                    $qq->where('request_type', 'TO')
                        ->where('isRequestingVehicle', 1);
                })->orWhere('request_type', 'VR');
            })
            ->orderByDesc('id')
            ->get()
            ->map(fn ($o) => [
                'value' => (int) $o->id,
                'label' => 'Travel Request No. ' . (string) $o->reference_no . ' - ' . (string) ($o->purpose ?? ''),
            ])
            ->values();
    }

    private function vehicles($conn2): Collection
    {
        return $conn2->table('travel_order_vehicles')
            ->select([
                'id as value',
                DB::raw("CONCAT(vehicle, ' (', plate_no, ')') as label"),
            ])
            ->orderBy('vehicle')
            ->get();
    }

    private function activeEmployeeOptions(): Collection
    {
        $conn3 = DB::connection('mysql3');

        $activeIds = $conn3->table('tblemployee')
            ->where('work_status', 'active')
            ->pluck('emp_id')
            ->map(fn ($id) => (string) $id)
            ->values();

        $employeesById = $this->employeeNamesById($activeIds, 'mysql3');

        return $activeIds
            ->map(fn ($empId) => [
                'value' => (string) $empId,
                'label' => (string) ($this->employeeName($employeesById, $empId) ?? $empId),
            ])
            ->sortBy(fn ($e) => mb_strtolower($e['label']))
            ->values();
    }

    private function nextReferenceNo($conn2): string
    {
        $year = now()->format('Y');

        $latest = $conn2->table('trip_tickets')
            ->whereRaw('LEFT(reference_no, 4) = ?', [$year])
            ->whereRaw('CHAR_LENGTH(reference_no) = 8')
            ->whereRaw('reference_no REGEXP "^[0-9]{4}-[0-9]{3}$"')
            ->orderByDesc('reference_no')
            ->value('reference_no');

        if (! $latest) {
            return "{$year}-001";
        }

        $seq = (int) substr((string) $latest, 5);

        return $year . '-' . str_pad((string) ($seq + 1), 3, '0', STR_PAD_LEFT);
    }
}
