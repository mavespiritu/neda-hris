<?php

namespace App\Actions\TravelRequests;

use App\Traits\BuildsEmployeeNameMap;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowTravelRequest
{
    use AsAction, BuildsEmployeeNameMap;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return Gate::forUser($request->user())->allows('tr.view', $id);
    }

    public function asController(ActionRequest $request): Response|RedirectResponse
    {
        $id = (int) $request->route('id');
        $payload = $this->handle($id);

        if (! $payload) {
            return redirect()->route('travel-requests.index')->with([
                'status' => 'error',
                'title' => 'Not found',
                'message' => 'Travel request not found.',
            ]);
        }

        return Inertia::render('TravelOrders/View', $payload);
    }

    public function handle(int $id): ?array
    {
        $conn2 = DB::connection('mysql2');

        $order = $this->fetchOrder($conn2, $id);
        if (! $order) return null;

        $latestHistories = $this->fetchLatestHistories($conn2, $id);
        $latestHistory = $latestHistories->get('TO');
        $latestVehicleRequestHistory = $latestHistories->get('Vehicle Request');

        $staffRows = $this->fetchStaffRows($conn2, $id);
        $destinations = $this->fetchDestinations($conn2, $id);
        $commutationExpenses = $this->fetchCommutationExpenses($conn2, $id);
        $vehicles = $this->fetchVehicles($conn2);
        $reasons = $this->fetchReasons($conn2);
        $serviceExpenses = $this->fetchServiceExpenses($conn2, $id);
        $pruReview = $this->fetchPruReview($conn2, $id);

        $dispatcherId = $pruReview?->dispatcher;
        $empIds = $this->collectEmployeeIds(
            order: $order,
            latestHistory: $latestHistory,
            latestVehicleRequestHistory: $latestVehicleRequestHistory,
            staffRows: $staffRows,
            serviceExpenses: $serviceExpenses,
            dispatcherId: $dispatcherId
        );

        $employeesById = $this->employeeNamesById($empIds, 'mysql3');
        $staffs = $this->mapStaffs($staffRows, $employeesById);
        $serviceExpenses = $this->mapServiceExpenses($serviceExpenses, $employeesById);

        if ($pruReview) {
            $pruReview->dispatcher_name = $this->employeeName($employeesById, $dispatcherId);
        }

        return [
            'travelOrder' => [
                'id' => (int) $order->id,
                'reference_no' => $order->reference_no,
                'category_title' => $order->category_title,
                'fund_source_title' => $order->fund_source_title,
                'start_date' => $order->start_date,
                'end_date' => $order->end_date,
                'purpose' => $order->purpose,
                'created_by' => $order->created_by,
                'creator' => $this->employeeName($employeesById, $order->created_by),
                'other_passengers' => $order->other_passengers,
                'other_vehicles' => $order->other_vehicles,
                'other_drivers' => $order->other_drivers,
                'isRequestingVehicle' => (bool) $order->isRequestingVehicle,
                'date_created' => $order->date_created,
                'staffs' => $staffs,
                'destinations' => $destinations,
                'commutation_expenses' => $commutationExpenses,

                'status' => $this->travelRequestStatusFromState($order->tr_state) ?? $latestHistory?->status ?? 'Draft',
                'acted_by' => $latestHistory?->acted_by,
                'acted_by_name' => $this->employeeName($employeesById, $latestHistory?->acted_by),
                'remarks' => $latestHistory?->remarks,
                'date_acted' => $latestHistory?->date_acted,

                'vehicle_request_status' => $this->vehicleRequestStatusFromState($order->vr_state) ?? $latestVehicleRequestHistory?->status,
                'vehicle_request_acted_by' => $latestVehicleRequestHistory?->acted_by,
                'vehicle_request_acted_by_name' => $this->employeeName($employeesById, $latestVehicleRequestHistory?->acted_by),
                'vehicle_request_remarks' => $latestVehicleRequestHistory?->remarks,
                'vehicle_request_date_acted' => $latestVehicleRequestHistory?->date_acted,

                'est_distance' => $order->est_distance,
                'est_departure_time' => $order->est_departure_time,
                'est_arrival_time' => $order->est_arrival_time,
                'review' => $pruReview,
            ],
            'vehicles' => $vehicles,
            'serviceExpenses' => $serviceExpenses,
            'reasons' => $reasons,
            'can' => $this->canMap($id),
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
                'tr_state',
                'vr_state',
                'travel_order_categories.title as category_title',
                'travel_order_fund_sources.title as fund_source_title',
                'approver_id',
                'est_distance',
                'est_departure_time',
                'est_arrival_time',
            ])
            ->leftJoin('travel_order_categories', 'travel_order.travel_category_id', '=', 'travel_order_categories.id')
            ->leftJoin('travel_order_fund_sources', 'travel_order.fund_source_id', '=', 'travel_order_fund_sources.id')
            ->where('travel_order.id', $id)
            ->first();
    }

    private function fetchLatestHistories($conn2, int $id): Collection
    {
        return $conn2->table('submission_history')
            ->where('model_id', $id)
            ->whereIn('model', ['TO', 'Vehicle Request'])
            ->orderByDesc('id')
            ->get()
            ->groupBy('model')
            ->map(fn (Collection $rows) => $rows->first());
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

    private function fetchCommutationExpenses($conn2, int $id): Collection
    {
        return $conn2->table('travel_order_expenses')
            ->where('travel_order_id', $id)
            ->get();
    }

    private function fetchVehicles($conn2): Collection
    {
        return $conn2->table('travel_order_vehicles')
            ->select(['id as value', 'vehicle', 'plate_no', 'avg_consumption'])
            ->orderBy('vehicle')
            ->get();
    }

    private function fetchReasons($conn2): Collection
    {
        return $conn2->table('travel_order_prioritizations')
            ->select(['id as value', 'reason as label'])
            ->orderBy('reason')
            ->get();
    }

    private function fetchServiceExpenses($conn2, int $id): Collection
    {
        return $conn2->table('travel_order_service_expenses as se')
            ->select([
                'se.id',
                'se.travel_order_id',
                'se.driver',
                'se.vehicle_id',
                'se.total_km',
                'se.total_gas',
                'se.gas_price',
                'se.toll_fee',
                'se.tev',
                'v.vehicle as vehicle_name',
                'v.plate_no',
                'se.avg_consumption',
            ])
            ->leftJoin('travel_order_vehicles as v', 'se.vehicle_id', '=', 'v.id')
            ->where('se.travel_order_id', $id)
            ->get();
    }

    private function fetchPruReview($conn2, int $id): ?object
    {
        return $conn2->table('travel_order_review')
            ->where('travel_order_id', $id)
            ->first();
    }

    private function collectEmployeeIds(
        object $order,
        ?object $latestHistory,
        ?object $latestVehicleRequestHistory,
        Collection $staffRows,
        Collection $serviceExpenses,
        $dispatcherId
    ): Collection {
        return collect([
            $order->created_by,
            $order->approver_id,
            $latestHistory?->acted_by,
            $latestVehicleRequestHistory?->acted_by,
            $dispatcherId,
        ])
            ->merge($staffRows->flatMap(fn ($s) => [$s->emp_id, $s->recommender_id, $s->approver_id]))
            ->merge($serviceExpenses->pluck('driver'))
            ->values();
    }

    private function mapStaffs(Collection $staffRows, Collection $employeesById): Collection
    {
        return $staffRows->map(fn ($s) => [
            'id' => (int) $s->id,
            'emp_id' => (string) $s->emp_id,
            'name' => $this->employeeName($employeesById, $s->emp_id),
            'recommender_id' => $s->recommender_id ? (string) $s->recommender_id : null,
            'recommender_name' => $this->employeeName($employeesById, $s->recommender_id),
            'approver_id' => $s->approver_id ? (string) $s->approver_id : null,
            'approver_name' => $this->employeeName($employeesById, $s->approver_id),
        ])->values();
    }

    private function mapServiceExpenses(Collection $serviceExpenses, Collection $employeesById): Collection
    {
        return $serviceExpenses->map(function ($se) use ($employeesById) {
            $se->driver_name = $this->employeeName($employeesById, $se->driver);
            return $se;
        });
    }

    private function canMap(int $id): array
    {
        $gate = Gate::forUser(auth()->user());

        return [
            'edit' => $gate->inspect('tr.edit', $id)->allowed(),
            'delete' => $gate->inspect('tr.delete', $id)->allowed(),
            'view' => $gate->inspect('tr.view', $id)->allowed(),
            'submit' => $gate->inspect('tr.submit', $id)->allowed(),
            'vrSubmit' => $gate->inspect('vr.submit', $id)->allowed(),
            'endorse' => $gate->inspect('vr.endorse', $id)->allowed(),
            'approve' => $gate->inspect('vr.approve', $id)->allowed(),
            'review' => $gate->inspect('vr.review', $id)->allowed(),
            'disapprove' => $gate->inspect('vr.disapprove', $id)->allowed(),
            'return' => $gate->inspect('vr.return', $id)->allowed(),
            'trReturn' => $gate->inspect('tr.return', $id)->allowed(),
            'trResubmit' => $gate->inspect('tr.resubmit', $id)->allowed(),
            'resubmit' => $gate->inspect('vr.resubmit', $id)->allowed(),
            'generate' => $gate->inspect('tr.generate', $id)->allowed(),
        ];
    }

    private function travelRequestStatusFromState($state): ?string
    {
        if (blank($state)) return null;

        $map = [
            \App\States\TravelRequest\Draft::class => 'Draft',
            \App\States\TravelRequest\Submitted::class => 'Submitted',
            \App\States\TravelRequest\Returned::class => 'Returned',
            \App\States\TravelRequest\Resubmitted::class => 'Resubmitted',
        ];

        $stateClass = is_object($state) ? get_class($state) : (string) $state;

        return $map[$stateClass] ?? class_basename($stateClass);
    }

    private function vehicleRequestStatusFromState($state): ?string
    {
        if (blank($state)) return null;

        $map = [
            \App\States\VehicleRequest\Draft::class => 'Draft',
            \App\States\VehicleRequest\Submitted::class => 'Submitted',
            \App\States\VehicleRequest\Endorsed::class => 'Endorsed',
            \App\States\VehicleRequest\Reviewed::class => 'Reviewed',
            \App\States\VehicleRequest\Approved::class => 'Approved',
            \App\States\VehicleRequest\Returned::class => 'Returned',
            \App\States\VehicleRequest\Resubmitted::class => 'Resubmitted',
            \App\States\VehicleRequest\Disapproved::class => 'Disapproved',
            //\App\States\VehicleRequest\VehicleAuthorized::class => 'Vehicle Authorized',
        ];

        $stateClass = is_object($state) ? get_class($state) : (string) $state;

        return $map[$stateClass] ?? class_basename($stateClass);
    }
}
