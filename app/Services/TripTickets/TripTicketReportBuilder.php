<?php

namespace App\Services\TripTickets;

use App\Traits\BuildsEmployeeNameMap;
use App\Support\DateRange;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TripTicketReportBuilder
{
    use BuildsEmployeeNameMap;

    public function build(int $id): ?array
    {
        $conn2 = DB::connection('mysql2');

        $ticket = $this->fetchTripTicket($conn2, $id);
        if (! $ticket) {
            return null;
        }

        $latestHistory = $this->fetchLatestToHistory($conn2, $ticket->travel_order_id);
        $staffRows = $this->fetchStaffRows($conn2, $ticket->travel_order_id);
        $rawDestinations = $this->fetchDestinations($conn2, $ticket->travel_order_id);

        $destinations = $rawDestinations->map(function ($d) {
            return [
                'id' => (int) $d->id,
                'type' => $d->type,
                'location' => $d->location,
                'country' => $d->country,
                'citymun' => $d->citymun ?? null,
                'citymunName' => $d->citymunName ?? null,
                'province' => $d->province ?? null,
                'provinceName' => $d->provinceName ?? null,
                'departure_time' => !empty($d->departure_time)
                    ? Carbon::parse($d->departure_time)->format('g:i A')
                    : '',
                'arrival_time' => !empty($d->arrival_time)
                    ? Carbon::parse($d->arrival_time)->format('g:i A')
                    : '',
            ];
        })->values();

        $empIds = $staffRows->flatMap(fn ($s) => [
            $s->emp_id,
            $s->recommender_id,
            $s->approver_id,
        ])
          ->push($ticket->dispatcher_id)
          ->push($ticket->driver_id)
          ->when($latestHistory?->acted_by, fn ($c) => $c->push($latestHistory->acted_by))
          ->values();

        $employeesById = $this->employeeNamesById($empIds, 'mysql3');

        $staffs = $staffRows->map(fn ($s) => [
            'id' => (int) $s->id,
            'emp_id' => (string) $s->emp_id,
            'name' => $this->employeeName($employeesById, $s->emp_id),
            'recommender_id' => $s->recommender_id ? (string) $s->recommender_id : null,
            'recommender_name' => $this->employeeName($employeesById, $s->recommender_id),
            'approver_id' => $s->approver_id ? (string) $s->approver_id : null,
            'approver_name' => $this->employeeName($employeesById, $s->approver_id),
        ])->values();

        $tripTicket = [
            'id' => (int) $ticket->id,
            'tt_reference_no' => $ticket->tt_reference_no,
            'date' => Carbon::parse($ticket->start_date)->format('F j, Y'),
            'plate_no' => $ticket->plate_no,
            'driver_name' => $this->employeeName($employeesById, $ticket->driver_id),
            'to_reference_no' => $ticket->to_reference_no,
            'passengers' => $staffs,
            'destinations' => $destinations,
            'prexc' => $ticket->prexc,
            'purpose' => $ticket->purpose,
            'authorized_by' => $latestHistory ? $this->employeeName($employeesById, $latestHistory->acted_by) : null,
            'authorized_by_designation' => $this->fetchAuthorizerDesignation($conn2, $ticket->travel_order_id) ?? null,
            'odo_start' => $ticket->odo_start,
            'odo_end' => $ticket->odo_end,
            'fuel_type' => $ticket->fuel_type,
            'dates' => DateRange::display($ticket->start_date, $ticket->end_date),
            'created_by' => $ticket->created_by,
            'creator' => $this->employeeName($employeesById, $ticket->created_by),
            'date_created' => Carbon::parse($ticket->date_created)->format('F j, Y'),
            
            
        ];

        $today = now()->format('YmdHis');
        $ttDate = Carbon::parse($ticket->date_created)->format('F_d_Y');

        return [
            'tripTicket' => $tripTicket,
            'filename' => "{$today}_TT_{$ttDate}.pdf",
        ];
    }

    private function fetchTripTicket($conn2, int $id): ?object
    {
        return $conn2->table('trip_tickets as tt')
            ->select([
                'tt.id',
                'tt.reference_no as tt_reference_no',
                'tt.dispatcher_id',
                'tt.driver_id',
                'tt.vehicle_id',
                'tt.odo_start',
                'tt.odo_end',
                'tt.prexc',
                'v.vehicle as vehicle_name',
                'v.plate_no',
                'v.fuel_type',
                'to.id as travel_order_id',
                'to.purpose',
                'to.reference_no as to_reference_no',
                'to.start_date',
                'to.end_date',
                'tt.created_at as date_created',
                'tt.created_by',
            ])
            ->leftJoin('travel_order as to', 'tt.travel_order_id', '=', 'to.id')
            ->leftJoin('travel_order_vehicles as v', 'tt.vehicle_id', '=', 'v.id')
            ->where('tt.id', $id)
            ->first();
    }

    private function fetchLatestToHistory($conn2, int $id): ?object
    {
        return $conn2->table('submission_history')
            ->where('model', 'Vehicle Request')
            ->where('model_id', $id)
            ->orderByDesc('date_acted')
            ->first();
    }

    private function fetchAuthorizerDesignation($conn2, int $id): ?string
    {
        return $conn2->table('travel_order_signatories')
            ->select('designation')
            ->where('type', 'Approver_TT')
            ->value('designation');
    }

    private function fetchStaffRows($conn2, int $id): Collection
    {
        return $conn2->table('travel_order_staffs')
            ->select(['id', 'emp_id', 'recommender_id', 'approver_id'])
            ->where('travel_order_id', $id)
            ->get();
    }

    private function fetchDestinations($conn2, int $id): Collection
    {
        return $conn2->table('travel_order_destinations')
            ->where('travel_order_id', $id)
            ->get();
    }
}
