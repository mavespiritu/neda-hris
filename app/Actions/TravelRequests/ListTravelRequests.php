<?php

namespace App\Actions\TravelRequests;

use App\Support\IndexTableQuery;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use App\Traits\BuildsEmployeeNameMap;

class ListTravelRequests
{
    use AsAction, BuildsEmployeeNameMap;

    public function authorize(ActionRequest $request): bool
    {
        return Gate::forUser($request->user())->allows('tr.viewAny');
    }

    public function asController(ActionRequest $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $user = $request->user();

        $query = IndexTableQuery::for($this->baseQuery($conn2, (string) $user->ipms_id))
            ->allowedFilters([
                'created_by' => fn ($q, $v) => $q->where('created_by', $v),
                'start_date' => fn ($q, $v) => $q->whereDate('start_date', Carbon::parse($v)->format('Y-m-d')),
            ])
            ->search(function ($q, string $term) {
                $q->where(function ($qq) use ($term) {
                    $qq->where('reference_no', 'like', "%{$term}%")
                    ->orWhere('travel_type', 'like', "%{$term}%")
                    ->orWhere('purpose', 'like', "%{$term}%")
                    ->orWhere('division', 'like', "%{$term}%");
                });
            })
            ->allowedSorts([
                'start_date' => 'start_date',
                'reference_no' => 'reference_no',
                'creator' => fn ($items, $direction) => $direction === 'desc'
                    ? $items->sortBy(fn ($t) => mb_strtolower((string) ($t->creator ?? '')))->reverse()
                    : $items->sortBy(fn ($t) => mb_strtolower((string) ($t->creator ?? ''))),
                'status' => fn ($items, $direction) => $direction === 'desc'
                    ? $items->sortBy(fn ($t) => mb_strtolower((string) ($t->status ?? '')))->reverse()
                    : $items->sortBy(fn ($t) => mb_strtolower((string) ($t->status ?? ''))),
            ])
            ->decorate(fn ($items, $req) => $this->decorateItems($items, $req, $conn2, $conn3))
            ->defaultSort('reference_no', 'desc')
            ->apply($request)
            ->paginate($request, 20);

        return Inertia::render('TravelOrders/index', [
            'data' => [
                'travelOrders' => $query,
                'filters' => $request->only(['created_by', 'start_date', 'employee_name', 'sort', 'direction', 'search']),
            ],
            'can' => [
                'create' => Gate::forUser($user)->inspect('tr.create')->allowed(),
            ],
        ]);
    }

    private function baseQuery($conn2, string $userEmpId)
    {
        return $conn2->table('travel_order')
            ->where('request_type', 'TO')
            ->where(function ($q) use ($userEmpId) {
                $q->where('travel_order.created_by', $userEmpId)
                  ->orWhereExists(function ($qq) use ($userEmpId) {
                      $qq->select(DB::raw(1))
                         ->from('travel_order_staffs as s')
                         ->whereColumn('s.travel_order_id', 'travel_order.id')
                         ->where('s.emp_id', $userEmpId);
                  });
            });
    }

    private function decorateItems($items, ActionRequest $request, $conn2, $conn3)
    {
        $ids = $items->pluck('id')->all();

        $histories = $conn2->table('submission_history')
            ->where('model', 'TO')
            ->whereIn('model_id', $ids)
            ->orderByDesc('date_acted')
            ->get()
            ->groupBy('model_id');

        $actedByIds = $histories->flatten()->pluck('acted_by');
        $creatorIds = $items->pluck('created_by');

        $employees = $this->employeeNamesById([$actedByIds, $creatorIds]);

        $gate = Gate::forUser($request->user());

        return $items->transform(function ($item) use ($employees, $histories, $gate) {
            $latest = $histories[$item->id][0] ?? null;

            $item->creator = $this->employeeName($employees, $item->created_by);
            $item->status = $latest->status ?? null;
            $item->acted_by = $latest->acted_by ?? null;
            $item->acted_by_name = $this->employeeName($employees, $latest->acted_by ?? null);
            $item->remarks = $latest->remarks ?? null;
            $item->date_acted = $latest->date_acted ?? null;

            $item->can = [
                'edit' => $gate->inspect('tr.edit', $item->id)->allowed(),
                'delete' => $gate->inspect('tr.delete', $item->id)->allowed(),
                'view' => $gate->inspect('tr.view', $item->id)->allowed(),
                'submit' => $gate->inspect('tr.submit', $item->id)->allowed(),
            ];

            return $item;
        });
    }
}
