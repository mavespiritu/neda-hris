<?php

namespace App\Services\TravelRequests;

use App\Traits\BuildsEmployeeNameMap;
use App\Support\DateRange;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TravelRequestReportBuilder
{
    use BuildsEmployeeNameMap;

    public function build(int $id): ?array
    {
        $conn2 = DB::connection('mysql2');

        $order = $this->fetchOrder($conn2, $id);
        if (! $order) {
            return null;
        }

        $latestHistory = $this->fetchLatestToHistory($conn2, $id);
        $staffRows = $this->fetchStaffRows($conn2, $id);
        $destinations = $this->fetchDestinations($conn2, $id);

        $empIds = $staffRows->flatMap(fn ($s) => [
            $s->emp_id,
            $s->recommender_id,
            $s->approver_id,
        ])->push($order->created_by)
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

        $travelOrder = [
            'id' => (int) $order->id,
            'reference_no' => $order->reference_no,
            'category_title' => $order->category_title,
            'fund_source_title' => $order->fund_source_title,
            'dates' => DateRange::display($order->start_date, $order->end_date),
            'purpose' => $order->purpose,
            'created_by' => $order->created_by,
            'creator' => $this->employeeName($employeesById, $order->created_by),
            'date_created' => Carbon::parse($order->date_created)->format('F j, Y'),
            'staffs' => $staffs,
            'destinations' => $destinations,
            'approver_designation' => $this->fetchApproverDesignation($conn2),
        ];

        $today = now()->format('YmdHis');
        $toDate = Carbon::parse($order->date_created)->format('F_d_Y');

        return [
            'travelOrder' => $travelOrder,
            'filename' => "{$today}_TO_{$toDate}.pdf",
        ];
    }

    private function fetchOrder($conn2, int $id): ?object
    {
        return $conn2->table('travel_order')
            ->select([
                'travel_order.id',
                'reference_no',
                'travel_category_id',
                'start_date',
                'end_date',
                'purpose',
                'fund_source_id',
                'other_passengers',
                'other_vehicles',
                'other_drivers',
                'isRequestingVehicle',
                'created_by',
                'date_created',
                'travel_order_categories.title as category_title',
                'travel_order_fund_sources.title as fund_source_title',
                'approver_id',
            ])
            ->leftJoin('travel_order_categories', 'travel_order.travel_category_id', '=', 'travel_order_categories.id')
            ->leftJoin('travel_order_fund_sources', 'travel_order.fund_source_id', '=', 'travel_order_fund_sources.id')
            ->where('travel_order.id', $id)
            ->first();
    }

    private function fetchLatestToHistory($conn2, int $id): ?object
    {
        return $conn2->table('submission_history')
            ->where('model', 'TO')
            ->where('model_id', $id)
            ->orderByDesc('date_acted')
            ->first();
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

    private function fetchApproverDesignation($conn2): ?string
    {
        return $conn2->table('travel_order_signatories')
            ->where('type', 'Approver_TO')
            ->value('designation');
    }
}
