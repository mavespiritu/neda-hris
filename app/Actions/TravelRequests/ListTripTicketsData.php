<?php

namespace App\Actions\TravelRequests;

use App\Support\IndexTableQuery;
use App\Traits\BuildsEmployeeNameMap;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ListTripTicketsData
{
    use AsAction, BuildsEmployeeNameMap;

    private function resolveTravelOrderId(ActionRequest $request): ?int
    {
        $id = $request->route('id') ?? $request->query('id');
        return blank($id) ? null : (int) $id;
    }

    public function authorize(ActionRequest $request): bool
    {
        $id = $this->resolveTravelOrderId($request);

        if (is_null($id)) {
            return Gate::forUser($request->user())->allows('tt.viewAny');
        }

        return Gate::forUser($request->user())->allows('tt.viewByVehicleRequest', (int) $id);
    }

    public function asController(ActionRequest $request): JsonResponse
    {
        $travelOrderId  = $this->resolveTravelOrderId($request);

        return response()->json($this->handle($request, $travelOrderId));
    }

    public function handle(ActionRequest $request, ?int $travelOrderId): array
    {
        $conn2 = DB::connection('mysql2');

        $query = IndexTableQuery::for($this->baseQuery($conn2, $travelOrderId))
            ->allowedFilters([
                'vehicle_id' => fn ($q, $v) => $q->where('tt.vehicle_id', (int) $v),
                'driver_id' => fn ($q, $v) => $q->where('tt.driver_id', (string) $v),
                'dispatcher_id' => fn ($q, $v) => $q->where('tt.dispatcher_id', (string) $v),
            ])
            ->search(function ($q, string $term) {
                $term = trim($term);

                $matchedEmpIds = DB::connection('mysql3')
                    ->table('tblemployee')
                    ->select('emp_id')
                    ->where('work_status', 'active')
                    ->whereRaw("
                        CONCAT(
                            fname, ' ',
                            IF(mname IS NOT NULL AND mname != '', CONCAT(LEFT(mname,1), '. '), ''),
                            lname
                        ) LIKE ?
                    ", ["%{$term}%"])
                    ->pluck('emp_id')
                    ->map(fn ($id) => (string) $id)
                    ->values();

                $q->where(function ($qq) use ($term, $matchedEmpIds) {
                    $qq->where('tt.reference_no', 'like', "%{$term}%")
                        ->orWhere('v.vehicle', 'like', "%{$term}%")
                        ->orWhere('v.plate_no', 'like', "%{$term}%")
                        ->orWhere('tt.remarks', 'like', "%{$term}%");

                    if ($matchedEmpIds->isNotEmpty()) {
                        $qq->orWhereIn('tt.driver_id', $matchedEmpIds)
                           ->orWhereIn('tt.dispatcher_id', $matchedEmpIds);
                    }
                });
            })
            ->allowedSorts([
                'reference_no' => 'tt.reference_no',
                'vehicle_name' => 'v.vehicle',
                'created_at' => 'tt.created_at',
                'driver_name' => fn ($items, $direction) => $direction === 'desc'
                    ? $items->sortBy(fn ($t) => mb_strtolower((string) ($t->driver_name ?? '')))->reverse()
                    : $items->sortBy(fn ($t) => mb_strtolower((string) ($t->driver_name ?? ''))),
                'dispatcher_name' => fn ($items, $direction) => $direction === 'desc'
                    ? $items->sortBy(fn ($t) => mb_strtolower((string) ($t->dispatcher_name ?? '')))->reverse()
                    : $items->sortBy(fn ($t) => mb_strtolower((string) ($t->dispatcher_name ?? ''))),
                'to.purpose',
                'to.to_reference_no',
            ])
            ->decorate(fn ($items, $req) => $this->decorateItems($items, $req))
            ->defaultSort('tt.id', 'desc')
            ->apply($request)
            ->paginate($request, (int) $request->input('per_page', 10));

        return [
            'trip_tickets' => $query,
            'filters' => $request->only([
                'vehicle_id',
                'driver_id',
                'dispatcher_id',
                'sort',
                'direction',
                'search',
                'per_page',
            ]),
            'filter_options' => $this->filterOptions($travelOrderId),
            'can' => $this->canMap($request, $travelOrderId),
        ];
    }

    private function baseQuery($conn2, ?int $travelOrderId)
    {
        $query = $conn2->table('trip_tickets as tt')
            ->select([
                'tt.id',
                'tt.travel_order_id',
                'tt.dispatcher_id',
                'tt.reference_no',
                'tt.vehicle_id',
                'tt.driver_id',
                'tt.odo_start',
                'tt.odo_end',
                'tt.remarks',
                'tt.created_by',
                'tt.updated_by',
                'tt.created_at',
                'tt.updated_at',
                'v.vehicle as vehicle_name',
                'v.plate_no',
                'to.reference_no as to_reference_no',
                'to.purpose',
                'to.start_date',
                'to.end_date',
            ])
            ->leftJoin('travel_order_vehicles as v', 'v.id', '=', 'tt.vehicle_id')
            ->leftJoin('travel_order as to', 'to.id', '=', 'tt.travel_order_id');

        if (!is_null($travelOrderId)) {
            $query->where('tt.travel_order_id', $travelOrderId);
        }

        return $query;
    }

    private function filterOptions(?int $travelOrderId): array
    {
        $conn2 = DB::connection('mysql2');

        $scope = $conn2->table('trip_tickets');
        if (! is_null($travelOrderId)) {
            $scope->where('travel_order_id', $travelOrderId);
        }

        $vehicleIds = (clone $scope)->pluck('vehicle_id')->filter()->unique()->values();
        $driverIds = (clone $scope)->pluck('driver_id')->filter()->map(fn ($v) => (string) $v)->unique()->values();
        $dispatcherIds = (clone $scope)->pluck('dispatcher_id')->filter()->map(fn ($v) => (string) $v)->unique()->values();

        $vehicles = $conn2->table('travel_order_vehicles')
            ->select(['id', 'vehicle', 'plate_no'])
            ->whereIn('id', $vehicleIds)
            ->orderBy('vehicle')
            ->get()
            ->map(fn ($v) => [
                'value' => (int) $v->id,
                'label' => trim("{$v->vehicle} ({$v->plate_no})"),
            ])
            ->values();

        $employeeIds = $driverIds->merge($dispatcherIds)->unique()->values();
        $employees = $this->employeeNamesById($employeeIds, 'mysql3');

        $drivers = $driverIds->map(fn ($id) => [
            'value' => (string) $id,
            'label' => $this->employeeName($employees, $id),
        ])->sortBy('label')->values();

        $dispatchers = $dispatcherIds->map(fn ($id) => [
            'value' => (string) $id,
            'label' => $this->employeeName($employees, $id),
        ])->sortBy('label')->values();

        return [
            'vehicles' => $vehicles,
            'drivers' => $drivers,
            'dispatchers' => $dispatchers,
        ];
    }

    private function decorateItems($items, ActionRequest $request)
    {
        $empIds = $items
            ->flatMap(fn ($r) => [$r->driver_id, $r->dispatcher_id, $r->created_by, $r->updated_by])
            ->filter()
            ->values();

        $employees = $this->employeeNamesById($empIds, 'mysql3');
        $gate = Gate::forUser($request->user());

        return $items->transform(function ($item) use ($employees, $gate) {
            $item->driver_name = $this->employeeName($employees, $item->driver_id);
            $item->dispatcher_name = $this->employeeName($employees, $item->dispatcher_id);
            $item->created_by_name = $this->employeeName($employees, $item->created_by);
            $item->updated_by_name = $this->employeeName($employees, $item->updated_by);
            $item->status = blank($item->odo_end)
            ? (blank($item->odo_start) ? 'Not Started' : 'In Progress')
            : 'Completed';

            $vehicleRequestId = (int) $item->travel_order_id;

            $item->can = [
                'view' => $gate->inspect('tt.viewByVehicleRequest', $vehicleRequestId)->allowed(),
                'edit' => $gate->inspect('tt.editByVehicleRequest', $vehicleRequestId)->allowed(),
                'delete' => $gate->inspect('tt.deleteByVehicleRequest', $vehicleRequestId)->allowed(),
                'generate' => $gate->inspect('tt.generate', $vehicleRequestId)->allowed(),
            ];

            return $item;
        });
    }

    private function canMap(ActionRequest $request, ?int $travelOrderId): array
    {
        $gate = Gate::forUser($request->user());

        if (is_null($travelOrderId)) {
            return [
                'view' => $gate->inspect('tt.viewAny')->allowed(),
                'create' => $gate->inspect('tt.create')->allowed(),
                'edit' => $gate->inspect('tt.edit')->allowed(),
                'delete' => $gate->inspect('tt.delete')->allowed(),
                'generate' => $gate->inspect('tt.generate')->allowed(),
            ];
        }

        return [
            'view' => $gate->inspect('tt.viewByVehicleRequest', $travelOrderId)->allowed(),
            'create' => $gate->inspect('tt.createByVehicleRequest', $travelOrderId)->allowed(),
            'edit' => $gate->inspect('tt.editByVehicleRequest', $travelOrderId)->allowed(),
            'delete' => $gate->inspect('tt.deleteByVehicleRequest', $travelOrderId)->allowed(),
            'generate' => $gate->inspect('tt.generate')->allowed(),
        ];
    }
}
